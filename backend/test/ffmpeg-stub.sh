#!/bin/sh
# Test-Stub: kopiert die Eingabe (-i <in>) auf die Zieldatei (letztes Argument)
in=""; prev=""; out=""
for a in "$@"; do
  [ "$prev" = "-i" ] && in="$a"
  prev="$a"; out="$a"
done
# Optional: Argumente protokollieren, damit Tests sie prüfen können
[ -n "$FFMPEG_ARGS_LOG" ] && echo "$*" >> "$FFMPEG_ARGS_LOG"
cp "$in" "$out"
