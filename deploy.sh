#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  Audiokonverter – Deployment
# ------------------------------------------------------------
#  Baut den Vue-3/Vite-Frontend-Build aus dem main-Branch und
#  veroeffentlicht ihn im NGINX-Ordner
#  /var/www/kodinitools.com/audiokonverter.
#  Anschliessend wird das PM2-Backend neu geladen.
#
#  Aufruf (auf dem Server, im Repo-Verzeichnis):
#      ./deploy.sh
#  oder ueber npm:
#      npm run deploy:linux
#
#  Konfigurierbar per Umgebungsvariablen:
#      DEPLOY_BRANCH        Branch, der deployt wird     (Default: main)
#      DEPLOY_TARGET        Ziel-/NGINX-Ordner           (Default: /var/www/kodinitools.com/audiokonverter)
#      DEPLOY_PM2_APP       Name des PM2-Prozesses       (Default: audiokonverter-server)
#      DEPLOY_SKIP_GIT=1    git fetch/reset ueberspringen (lokalen Stand bauen)
#      DEPLOY_SKIP_BACKEND=1 PM2-Reload ueberspringen (nur Frontend deployen)
# ============================================================

# --- Konfiguration ------------------------------------------
BRANCH="${DEPLOY_BRANCH:-main}"
TARGET_DIR="${DEPLOY_TARGET:-/var/www/kodinitools.com/audiokonverter}"
PM2_APP="${DEPLOY_PM2_APP:-audiokonverter-server}"

# Laufzeit-Ordner/Dateien des Backends im Zielverzeichnis, die
# beim Sync NICHT geloescht werden duerfen (Zielordner ist
# zugleich NGINX-Root und PM2-cwd). "downloads" enthaelt die
# manuell abgelegten Desktop-Installer (.exe/.msi/.zip), auf die
# der Download-Bereich in index.html verlinkt – sie sind nicht
# Teil des Repos/Builds und muessen Deploys ueberleben:
KEEP=(uploads output files node_modules .env downloads)

# Repo-Root = Verzeichnis dieses Skripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# --- Voraussetzungen pruefen --------------------------------
command -v node >/dev/null 2>&1 || fail "node ist nicht installiert."
command -v npm  >/dev/null 2>&1 || fail "npm ist nicht installiert."

# --- 1. Aktuellen Stand von origin/<branch> holen -----------
if [[ "${DEPLOY_SKIP_GIT:-0}" != "1" ]]; then
  log "Hole aktuellen Stand von origin/$BRANCH"
  git fetch --prune origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  log "DEPLOY_SKIP_GIT=1 – ueberspringe git, baue aktuellen Arbeitsstand"
fi
COMMIT="$(git rev-parse --short HEAD)"
log "Deploye Commit $COMMIT (Branch $BRANCH)"

# --- 2. Dependencies installieren ---------------------------
if [[ -f package-lock.json ]]; then
  log "Installiere Dependencies (npm ci)"
  npm ci --include=dev
else
  log "Installiere Dependencies (npm install)"
  npm install --include=dev
fi

# --- 3. Production-Build ------------------------------------
log "Erstelle Production-Build (Vite, base /audiokonverter/)"
npm run build
[[ -f dist/index.html ]] || fail "Build fehlgeschlagen: dist/index.html nicht gefunden."

# --- 4. In NGINX-Zielordner veroeffentlichen ----------------
log "Veroeffentliche Build nach $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Alte statische Dateien entfernen, damit veraltete (gehashte)
# Assets nicht liegenbleiben. Laufzeit-/KEEP-Eintraege bleiben
# erhalten (Zielordner ist zugleich NGINX-Root und PM2-cwd).
shopt -s nullglob dotglob
for entry in "$TARGET_DIR"/*; do
  name="$(basename "$entry")"
  keep=0
  for k in "${KEEP[@]}"; do [[ "$name" == "$k" ]] && keep=1 && break; done
  [[ $keep -eq 1 ]] && continue
  rm -rf "$entry"
done
shopt -u nullglob dotglob

# Frischen Build hineinkopieren (inkl. Dotfiles)
cp -a dist/. "$TARGET_DIR"/

# --- 5. Backend (PM2) neu laden -----------------------------
if [[ "${DEPLOY_SKIP_BACKEND:-0}" == "1" ]]; then
  log "DEPLOY_SKIP_BACKEND=1 – ueberspringe PM2-Reload"
elif command -v pm2 >/dev/null 2>&1 && pm2 describe "$PM2_APP" >/dev/null 2>&1; then
  log "Lade PM2-Backend neu: $PM2_APP"
  pm2 reload "$PM2_APP" --update-env
else
  log "PM2-Prozess '$PM2_APP' nicht gefunden – Backend-Reload uebersprungen"
  log "Erststart ggf. mit: pm2 start ecosystem.config.js"
fi

log "✓ Deployment abgeschlossen (Commit $COMMIT → $TARGET_DIR)"
