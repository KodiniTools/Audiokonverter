#!/bin/sh
# Test-Stub: kopiert die Eingabe (-i <in>) auf die Zieldatei (letztes Argument)
in=""; prev=""; out=""; progress=""
for a in "$@"; do
  [ "$prev" = "-i" ] && in="$a"
  if [ "$prev" = "-progress" ] && [ "$a" = "pipe:1" ]; then progress=1; fi
  prev="$a"; out="$a"
done
# Optional: Argumente protokollieren, damit Tests sie prüfen können
[ -n "$FFMPEG_ARGS_LOG" ] && echo "$*" >> "$FFMPEG_ARGS_LOG"
# Optional: Laufzeit simulieren und Start/Ende protokollieren (Parallelitäts-Test)
if [ -n "$FFMPEG_STUB_EVENTS" ]; then echo "start $$" >> "$FFMPEG_STUB_EVENTS"; fi
if [ -n "$FFMPEG_STUB_DELAY" ]; then sleep "$FFMPEG_STUB_DELAY"; fi
# Optional: Fortschritt wie `-progress pipe:1` melden (Mikrosekunden, je Schritt
# FFMPEG_STUB_STEP_DELAY Sekunden Pause)
if [ -n "$progress" ] && [ -n "$FFMPEG_STUB_PROGRESS_US" ]; then
  for us in $FFMPEG_STUB_PROGRESS_US; do
    printf 'out_time_us=%s\nprogress=continue\n' "$us"
    if [ -n "$FFMPEG_STUB_STEP_DELAY" ]; then sleep "$FFMPEG_STUB_STEP_DELAY"; fi
  done
  printf 'progress=end\n'
fi
cp "$in" "$out" || exit 1
if [ -n "$FFMPEG_STUB_EVENTS" ]; then echo "end $$" >> "$FFMPEG_STUB_EVENTS"; fi
