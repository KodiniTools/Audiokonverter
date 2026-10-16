#!/bin/sh
# Test-Stub: kopiert die Eingabe (-i <in>) auf die Zieldatei (letztes Argument)
in=""; prev=""; out=""
for a in "$@"; do
  [ "$prev" = "-i" ] && in="$a"
  prev="$a"; out="$a"
done
# Optional: Argumente protokollieren, damit Tests sie prüfen können
[ -n "$FFMPEG_ARGS_LOG" ] && echo "$*" >> "$FFMPEG_ARGS_LOG"
# Optional: Laufzeit simulieren und Start/Ende protokollieren (Parallelitäts-Test)
if [ -n "$FFMPEG_STUB_EVENTS" ]; then echo "start $$" >> "$FFMPEG_STUB_EVENTS"; fi
if [ -n "$FFMPEG_STUB_DELAY" ]; then sleep "$FFMPEG_STUB_DELAY"; fi
cp "$in" "$out" || exit 1
if [ -n "$FFMPEG_STUB_EVENTS" ]; then echo "end $$" >> "$FFMPEG_STUB_EVENTS"; fi
