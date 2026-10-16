#!/bin/sh
# Test-Stub für ffprobe: meldet FFPROBE_STUB_DURATION (Sekunden) als Dauer.
# Ohne Wert scheitert er wie ffprobe bei einer unlesbaren Datei.
if [ -z "$FFPROBE_STUB_DURATION" ]; then exit 1; fi
echo "$FFPROBE_STUB_DURATION"
