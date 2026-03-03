const express = require("express");
const path = require("path");
const fs = require("fs");
const os = require("os");
const https = require("https");
const { spawn } = require("child_process");
const multer = require("multer");
const { extension: extFromMime } = require("mime-types");
const { nanoid } = require("nanoid");

const app = express();
const PORT = process.env.PORT || 9000;
const FILES_DIR = process.env.FILES_DIR || path.join(__dirname, "files");

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 300 * 1024 * 1024 },
});

ensureDir(FILES_DIR);
app.use("/files", express.static(FILES_DIR, { fallthrough: false }));

app.get("/health", (_req, res) =>
  res.json({ ok: true, port: Number(PORT), filesDir: FILES_DIR })
);

// ---- Utils ----
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function safeUnlink(p) { try { fs.unlinkSync(p); } catch (_) {} }
function sanitizeOutputName(base, wantedExt) {
  const cleanBase = String(base).replace(/[^a-z0-9_\-\.]+/gi, "_").replace(/\.+/g, ".");
  const ext = (wantedExt || "").replace(/[^a-z0-9]/gi, "");
  return ext ? (cleanBase + "." + ext) : cleanBase;
}
function isAllowedFormat(fmt) {
  return ["mp3","wav","flac","aac","ogg","m4a","wma","opus","aiff"].includes(String(fmt||"").toLowerCase());
}
function validateBitrate(br){ return typeof br==="string" && /^[1-9]\d{1,3}k$/i.test(br); }
function validateSampleRate(sr){ const n=Number(sr); return Number.isInteger(n)&&n>=8000&&n<=192000; }
function validateChannels(ch){ const n=Number(ch); return Number.isInteger(n)&&n>=1&&n<=8; }

function runFfmpeg(args, timeoutMs=120000) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-nostdin", ...args], { stdio: ["ignore","pipe","pipe"] });
    let stderr = "";
    let killedByTimeout = false;
    const timer = setTimeout(() => {
      killedByTimeout = true;
      try { ff.kill("SIGKILL"); } catch (_) {}
    }, timeoutMs);
    ff.stderr.on("data", d => stderr += d.toString());
    ff.on("close", code => {
      clearTimeout(timer);
      if (killedByTimeout) return reject(new Error("ffmpeg_timeout"));
      code === 0 ? resolve() : reject(new Error(stderr || ("ffmpeg_exit_"+code)));
    });
  });
}

// ---- Upload (einfach) ----
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok:false, error:"no_file" });
    const origBase = path.parse(req.file.originalname || "upload").name || "upload";
    const guessedExt = extFromMime(req.file.mimetype) || path.extname(req.file.originalname).slice(1) || "bin";
   const outName = sanitizeOutputName(origBase, guessedExt);
    const outPath = path.join(FILES_DIR, outName);
    await fs.promises.rename(req.file.path, outPath);
    console.log("[upload ok]", outName, req.file.size+"B");
    res.json({ ok:true, filename:path.basename(outPath), url:"/files/"+path.basename(outPath) });
  } catch (e) {
    safeUnlink(req.file?.path);
    console.error("[upload err]", e.message);
    res.status(500).json({ ok:false, error:e.message });
  }
});

// ---- Convert (sync oder optional async) ----
const jobs = new Map();

app.get("/api/job/:id", (req,res)=>{
  const j = jobs.get(req.params.id);
  if(!j) return res.status(404).json({ok:false, error:"job_not_found"});
  res.json({ ok:true, ...j });
});

app.post("/api/convert", upload.single("file"), async (req, res) => {
  const isAsync = String(req.query.async||"false").toLowerCase()==="true";
  const jobId = nanoid(8);

  const task = async () => {
    let tmpIn = null;
    try {
      if (req.file) {
        tmpIn = req.file.path;
      } else if (req.body && typeof req.body.file_url === "string") {
        const rel = req.body.file_url.replace(/^\/+/, "");
        if (!rel.startsWith("files/")) throw new Error("bad_file_url");
        const localPath = path.join(FILES_DIR, rel.replace(/^files\//,""));
        if (!fs.existsSync(localPath)) throw new Error("source_not_found");
        tmpIn = path.join(os.tmpdir(), "in-"+nanoid(6)+path.extname(localPath));
        await fs.promises.copyFile(localPath, tmpIn);
      } else {
        throw new Error("no_input");
      }

      const fmt = String(req.body.format||"").toLowerCase();
      if (!isAllowedFormat(fmt)) throw new Error("bad_format");
      const bitrate=req.body.bitrate, samplerate=req.body.samplerate, channels=req.body.channels;
      const normalize = String(req.body.normalize||"false").toLowerCase()==="true";
      if (bitrate && !validateBitrate(bitrate)) throw new Error("bad_bitrate");
      if (samplerate && !validateSampleRate(samplerate)) throw new Error("bad_samplerate");
      if (channels && !validateChannels(channels)) throw new Error("bad_channels");

      const base = (path.parse(req.file?.originalname || req.body.file_url || "audio").name || "audio").replace(/[^a-z0-9_\-\.]+/gi,"_");
      const outName = sanitizeOutputName(base + "-" + nanoid(6), fmt);
      const outPath = path.join(FILES_DIR, outName);

      const args = ["-y", "-i", tmpIn];
      if (samplerate) args.push("-ar", String(samplerate));
      if (channels) args.push("-ac", String(channels));
      if (normalize) args.push("-filter:a", "loudnorm=I=-16:TP=-1.5:LRA=11");

      switch(fmt){
        case "mp3":
          args.push("-codec:a","libmp3lame"); bitrate? args.push("-b:a",bitrate): args.push("-q:a","2"); break;
        case "aac":
          args.push("-codec:a","aac"); if (bitrate) args.push("-b:a",bitrate); break;
        case "m4a":
          args.push("-vn","-codec:a","aac"); if (bitrate) args.push("-b:a",bitrate); args.push("-movflags","+faststart"); break;
        case "ogg":
          args.push("-codec:a","libvorbis"); if (bitrate) args.push("-b:a",bitrate); break;
        case "flac":
          args.push("-codec:a","flac"); break;
        case "wav":
          args.push("-codec:a","pcm_s16le"); break;
        case "wma":
          args.push("-codec:a","wmav2"); if (bitrate) args.push("-b:a",bitrate); break;
        case "opus":
          args.push("-codec:a","libopus"); if (bitrate) args.push("-b:a",bitrate); else args.push("-b:a","128k"); break;
        case "aiff":
          args.push("-codec:a","pcm_s16be"); break;
      }

      args.push(outPath);

      console.log("[convert start]", { port:PORT, in:tmpIn, fmt, bitrate, samplerate, channels, normalize, out:outPath });
      await runFfmpeg(args, 120000);
      console.log("[convert ok]", outPath);
     const stats = fs.statSync(outPath);
return { url:"/files/"+path.basename(outPath), filename:path.basename(outPath), format:fmt, size: stats.size };

    } catch (e) {
      console.error("[convert err]", e.message);
      throw e;
    } finally {
      if (req.file && fs.existsSync(req.file.path)) safeUnlink(req.file.path);
    }
  };

  if (isAsync) {
    jobs.set(jobId, { status:"queued" });
    (async () => {
      jobs.set(jobId, { status:"running" });
      try {
        const out = await task();
        jobs.set(jobId, { status:"done", outUrl: out.url, filename: out.filename, format: out.format });
      } catch (e) {
        jobs.set(jobId, { status:"error", error: e.message });
      }
    })();
    return res.status(202).json({ ok:true, jobId });
  } else {
    try {
      const out = await task();
      return res.json({ ok:true, ...out });
    } catch (e) {
      const code = e.message==="ffmpeg_timeout" ? 504 : 500;
      return res.status(code).json({ ok:false, error:e.message });
    }
  }
});

// ---- TTS Proxy (Narakeet API) ----
app.post("/api/tts", express.json(), async (req, res) => {
  const NARAKEET_API_KEY = 'rPqWwEFnbq5MDmxYGtAaY4b4mKkjE7xR8fplS8Ng';

  try {
    const { text, voice = 'vicki', speed = 1.0, volume = 'medium', format = 'mp3' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'Text required' });
    }

    const apiUrl = new URL(`https://api.narakeet.com/text-to-speech/${format}`);
    apiUrl.searchParams.append('voice', voice);
    if (speed !== 1.0) {
      apiUrl.searchParams.append('voice-speed', speed.toString());
    }
    if (volume !== 'medium') {
      apiUrl.searchParams.append('voice-volume', volume);
    }
    console.log(`[TTS] Request: ${text.substring(0, 50)}... (voice: ${voice})`);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'x-api-key': NARAKEET_API_KEY,
        'accept': 'application/octet-stream'
      }
    };

    const apiReq = https.request(apiUrl, options, (apiRes) => {
      if (apiRes.statusCode !== 200) {
        let errorData = '';
        apiRes.on('data', chunk => errorData += chunk.toString());
        apiRes.on('end', () => {
          console.error(`[TTS] API Error ${apiRes.statusCode}: ${errorData}`);
          res.status(apiRes.statusCode).json({ ok: false, error: errorData || 'API request failed' });
        });
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      apiRes.pipe(res);

      apiRes.on('end', () => {
        console.log('[TTS] Audio successfully sent');
      });
    });

    apiReq.on('error', (error) => {
      console.error('[TTS] Request error:', error);
      res.status(500).json({ ok: false, error: error.message });
    });

    apiReq.write(text);
    apiReq.end();

  } catch (e) {
    console.error('[TTS] Error:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========================================
// MUSIK-PLAYER ENDPOINTS
// ========================================

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Onomatopeja_1357";
const sessions = new Map();
const PLAYLISTS_FILE = path.join(__dirname, "playlists.json");
const PLAYER_STATE_FILE = path.join(__dirname, "player-state.json");

// Helper: Playlists laden/speichern
function loadPlaylists() {
  try {
    if (fs.existsSync(PLAYLISTS_FILE)) {
      return JSON.parse(fs.readFileSync(PLAYLISTS_FILE, "utf8"));
    }
  } catch (e) {
    console.error("[playlists] Load error:", e.message);
  }
  return [];
}

function savePlaylists(playlists) {
  try {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
    return true;
  } catch (e) {
    console.error("[playlists] Save error:", e.message);
    return false;
  }
}

// Helper: Player-State laden/speichern
function loadPlayerState() {
  try {
    if (fs.existsSync(PLAYER_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(PLAYER_STATE_FILE, "utf8"));
    }
  } catch (e) {
    console.error("[player-state] Load error:", e.message);
  }
  return { isPlaying: false, currentTrack: null, currentTime: 0, volume: 1, playlistId: null };
}

function savePlayerState(state) {
  try {
    fs.writeFileSync(PLAYER_STATE_FILE, JSON.stringify(state, null, 2));
    return true;
  } catch (e) {
    console.error("[player-state] Save error:", e.message);
    return false;
  }
}

// Auth Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  const token = authHeader.substring(7);
  if (!sessions.has(token)) {
    return res.status(401).json({ ok: false, error: "invalid_token" });
  }
  req.user = sessions.get(token);
  next();
}

// Login
app.post("/api/login", (req, res) => {
  try {
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ ok: false, error: "invalid_password" });
    }
    const token = nanoid(32);
    sessions.set(token, { username: "admin", loginTime: Date.now() });
    console.log("[login] Admin logged in");
    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Logout
app.post("/api/logout", requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7);
  sessions.delete(token);
  console.log("[logout] Admin logged out");
  res.json({ ok: true });
});

// Check Auth
app.get("/api/auth/check", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// ---- PLAYLISTS ----

// Alle Playlists abrufen

app.get("/api/playlists", (req, res) => {
  try {
    const playlists = loadPlaylists();
    res.json({ ok: true, playlists });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Neue Playlist erstellen
app.post("/api/playlists", requireAuth, (req, res) => {
  try {
    const { name, description = "" } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "name_required" });
    }
    
    const playlists = loadPlaylists();
    const newPlaylist = {
      id: nanoid(10),
      name: name.trim(),
      description: description.trim(),
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    playlists.push(newPlaylist);
    savePlaylists(playlists);
    
    console.log("[playlist] Created:", newPlaylist.name);
    res.json({ ok: true, playlist: newPlaylist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Playlist aktualisieren - GEFIXT: Übernimmt jetzt ALLE Felder inkl. tracks!
app.put("/api/playlists/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const playlists = loadPlaylists();
    const playlistIndex = playlists.findIndex(p => p.id === id);
    
    if (playlistIndex === -1) {
      return res.status(404).json({ ok: false, error: "playlist_not_found" });
    }
    
    // WICHTIG: Alle Felder aus updateData übernehmen (inkl. tracks!)
    const updatedPlaylist = {
      ...playlists[playlistIndex],
      ...updateData,
      id, // ID darf nicht geändert werden
      updatedAt: new Date().toISOString()
    };
    
    playlists[playlistIndex] = updatedPlaylist;
    savePlaylists(playlists);
    
    console.log("[playlist] Updated:", updatedPlaylist.name, "| Tracks:", updatedPlaylist.tracks?.length || 0);
    res.json({ ok: true, playlist: updatedPlaylist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Playlist löschen
app.delete("/api/playlists/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    let playlists = loadPlaylists();
    const index = playlists.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({ ok: false, error: "playlist_not_found" });
    }
    
    const deleted = playlists.splice(index, 1)[0];
    savePlaylists(playlists);
    
    console.log("[playlist] Deleted:", deleted.name);
    res.json({ ok: true, playlist: deleted });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Track zur Playlist hinzufügen
app.post("/api/playlists/:id/tracks", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { filename, title, artist = "", duration = 0 } = req.body;
    
    if (!filename) {
      return res.status(400).json({ ok: false, error: "filename_required" });
    }
    
    const playlists = loadPlaylists();
    const playlist = playlists.find(p => p.id === id);
    
    if (!playlist) {
      return res.status(404).json({ ok: false, error: "playlist_not_found" });
    }
    
    const filePath = path.join(FILES_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "file_not_found" });
    }
    
    const track = {
      id: nanoid(10),
      filename,
      title: title || path.parse(filename).name,
      artist,
      duration,
      url: "/modernermusikplayer/files/" + filename,
      addedAt: new Date().toISOString()
    };
    
    playlist.tracks.push(track);
    playlist.updatedAt = new Date().toISOString();
    savePlaylists(playlists);
    
    console.log("[playlist] Added track:", track.title, "to", playlist.name);
    res.json({ ok: true, track, playlist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Track aus Playlist entfernen
app.delete("/api/playlists/:id/tracks/:trackId", requireAuth, (req, res) => {
  try {
    const { id, trackId } = req.params;
    
    const playlists = loadPlaylists();
    const playlist = playlists.find(p => p.id === id);
    
    if (!playlist) {
      return res.status(404).json({ ok: false, error: "playlist_not_found" });
    }
    
    const trackIndex = playlist.tracks.findIndex(t => t.id === trackId);
    if (trackIndex === -1) {
      return res.status(404).json({ ok: false, error: "track_not_found" });
    }
    
    const deleted = playlist.tracks.splice(trackIndex, 1)[0];
    playlist.updatedAt = new Date().toISOString();
    savePlaylists(playlists);
    
    console.log("[playlist] Removed track:", deleted.title, "from", playlist.name);
    res.json({ ok: true, track: deleted, playlist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Track-Reihenfolge ändern
app.put("/api/playlists/:id/tracks/reorder", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { trackIds } = req.body;
    
    if (!Array.isArray(trackIds)) {
      return res.status(400).json({ ok: false, error: "trackIds_array_required" });
    }
    
    const playlists = loadPlaylists();
    const playlist = playlists.find(p => p.id === id);
    
    if (!playlist) {
      return res.status(404).json({ ok: false, error: "playlist_not_found" });
    }
    
    const newTracks = [];
    for (const trackId of trackIds) {
      const track = playlist.tracks.find(t => t.id === trackId);
      if (track) newTracks.push(track);
    }
    
    playlist.tracks = newTracks;
    playlist.updatedAt = new Date().toISOString();
    savePlaylists(playlists);
    
    console.log("[playlist] Reordered tracks in:", playlist.name);
    res.json({ ok: true, playlist });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- TRACKS (Alle verfügbaren Audio-Dateien) ----

// ÖFFENTLICH - Alle Tracks auflisten (ohne Auth)
app.get("/api/tracks", (req, res) => {
  try {
    const files = fs.readdirSync(FILES_DIR);
    const audioExts = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"];
    
    const tracks = files
      .filter(f => audioExts.includes(path.extname(f).toLowerCase()))
      .map(f => {
        const stats = fs.statSync(path.join(FILES_DIR, f));
        return {
          filename: f,
          title: path.parse(f).name,
          url: "/modernermusikplayer/files/" + f,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    
    res.json({ ok: true, tracks, count: tracks.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Track löschen (mit Auth)
app.delete("/api/tracks/:filename", requireAuth, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(FILES_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: "file_not_found" });
    }
    
    const playlists = loadPlaylists();
    let modified = false;
    
    playlists.forEach(playlist => {
      const before = playlist.tracks.length;
      playlist.tracks = playlist.tracks.filter(t => t.filename !== filename);
      if (playlist.tracks.length !== before) {
        playlist.updatedAt = new Date().toISOString();
        modified = true;
      }
    });
    
    if (modified) {
      savePlaylists(playlists);
    }
    
    fs.unlinkSync(filePath);
    console.log("[track] Deleted:", filename);
    
    res.json({ ok: true, filename });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- MUSIKPLAYER FILE MANAGEMENT ----

// Musikplayer-spezifischer Upload (mit vollständiger Track-Info)
app.post("/api/files/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "no_file" });
    
    const origBase = path.parse(req.file.originalname || "upload").name || "upload";
    const guessedExt = extFromMime(req.file.mimetype) || path.extname(req.file.originalname).slice(1) || "bin";
    const outName = sanitizeOutputName(origBase + "-" + nanoid(7), guessedExt);
    const outPath = path.join(FILES_DIR, outName);
    
    await fs.promises.rename(req.file.path, outPath);
    console.log("[musikplayer upload ok]", outName, req.file.size + "B");
    
    // Musikplayer-kompatible Response mit allen benötigten Feldern
    const track = {
      id: nanoid(10),
      filename: path.basename(outPath),
      name: origBase,
      originalName: req.file.originalname,
      title: origBase,
      url: "/modernermusikplayer/files/" + path.basename(outPath),
      size: req.file.size,
      duration: 0, // Wird vom Frontend gesetzt wenn Audio geladen wird
      artist: "",
      uploadedAt: new Date().toISOString()
    };
    
    res.json({ ok: true, file: track });
  } catch (e) {
    safeUnlink(req.file?.path);
    console.error("[musikplayer upload err]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Alle Audio-Dateien löschen
app.delete("/api/files/clear", requireAuth, (req, res) => {
  try {
    const files = fs.readdirSync(FILES_DIR);
    const audioExts = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"];
    
    let deletedCount = 0;
    files
      .filter(f => audioExts.includes(path.extname(f).toLowerCase()))
      .forEach(f => {
        const filePath = path.join(FILES_DIR, f);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log("[file deleted]", f);
        } catch (e) {
          console.error("[delete error]", f, e.message);
        }
      });
    
    // Auch alle Playlists leeren
    const playlists = loadPlaylists();
    playlists.forEach(playlist => {
      playlist.tracks = [];
      playlist.updatedAt = new Date().toISOString();
    });
    savePlaylists(playlists);
    
    console.log("[files cleared]", deletedCount, "files deleted");
    res.json({ ok: true, deletedCount });
  } catch (e) {
    console.error("[clear error]", e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---- PLAYER STATE ----

app.get("/api/player/state", requireAuth, (req, res) => {
  try {
    const state = loadPlayerState();
    res.json({ ok: true, state });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.put("/api/player/state", requireAuth, (req, res) => {
  try {
    const currentState = loadPlayerState();
    const newState = { ...currentState, ...req.body };
    savePlayerState(newState);
    res.json({ ok: true, state: newState });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ========================================
// END MUSIK-PLAYER ENDPOINTS
// ========================================

app.listen(PORT, "127.0.0.1", () => {
  console.log("Backend common auf http://127.0.0.1:" + PORT + " (FILES_DIR=" + FILES_DIR + ")");
});
