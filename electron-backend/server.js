import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import os from 'os';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow all origins for Electron app
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

app.use(express.json());

// Middleware to handle both /audiokonverter/* and /* paths
// This allows Electron (without proxy) to work with direct paths
app.use((req, res, next) => {
  // If path doesn't start with /audiokonverter but we have that endpoint, add it
  if (!req.path.startsWith('/audiokonverter') &&
      (req.path.startsWith('/api/') || req.path.startsWith('/files/'))) {
    req.url = '/audiokonverter' + req.url;
    console.log('Path rewritten:', req.path, '-> /audiokonverter' + req.path);
  }
  next();
});

// Create temp directories
const uploadsDir = path.join(os.tmpdir(), 'audiokonverter-uploads');
const outputDir = path.join(os.tmpdir(), 'audiokonverter-output');

await fs.mkdir(uploadsDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a'];
    if (allowedMimes.includes(file.mimetype) || /\.(mp3|wav|flac|ogg|aac|m4a)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Get FFmpeg path
function getFFmpegPath() {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  // Use @ffmpeg-installer/ffmpeg (includes binaries for all platforms)
  if (ffmpegInstaller && ffmpegInstaller.path) {
    return ffmpegInstaller.path;
  }

  // Fallback to system ffmpeg
  return 'ffmpeg';
}

// Quality to bitrate mapping
const qualityMap = {
  1: '64k',
  2: '96k',
  3: '128k',
  4: '160k',
  5: '192k',
  6: '224k',
  7: '256k',
  8: '288k',
  9: '320k',
  10: '320k'
};

// Convert audio file
async function convertAudio(inputPath, outputPath, format, quality) {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    const bitrate = qualityMap[quality] || '192k';

    // Build FFmpeg arguments based on format with explicit codecs
    const args = [
      '-fflags', '+genpts',         // Generate presentation timestamps
      '-err_detect', 'ignore_err',  // Ignore errors during decoding
      '-i', inputPath,
      '-vn', // No video
      '-map', '0:a?',               // Map audio stream if available
    ];

    // Set codec and parameters based on output format
    switch (format.toLowerCase()) {
      case 'mp3':
        args.push('-codec:a', 'libmp3lame', '-b:a', bitrate);
        break;
      case 'wav':
        args.push('-codec:a', 'pcm_s16le');
        break;
      case 'flac':
        args.push('-codec:a', 'flac', '-compression_level', '5');
        break;
      case 'ogg':
        args.push('-codec:a', 'libvorbis', '-b:a', bitrate);
        break;
      case 'aac':
      case 'm4a':
        args.push('-codec:a', 'aac', '-b:a', bitrate);
        break;
      default:
        args.push('-b:a', bitrate);
    }

    args.push('-y', outputPath); // Overwrite output file

    console.log('[Electron Backend] FFmpeg command:', ffmpegPath, args.join(' '));

    const ffmpeg = spawn(ffmpegPath, args);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Audio Konverter Backend is running' });
});

// Convert endpoint
app.post('/audiokonverter/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }

    const { format = 'mp3', quality = 7 } = req.body;
    const inputPath = req.file.path;
    const outputFilename = `${path.parse(req.file.originalname).name}.${format}`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log(`Converting ${req.file.originalname} to ${format} with quality ${quality}`);

    // Perform conversion
    await convertAudio(inputPath, outputPath, format, parseInt(quality));

    // Verify output file exists and has content
    try {
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        throw new Error('Output file is empty');
      }
      console.log(`Conversion successful: ${outputFilename} (${stats.size} bytes)`);
    } catch (err) {
      console.error('Output file verification failed:', err);
      // Clean up empty/invalid output file
      await fs.unlink(outputPath).catch(() => {});
      throw new Error('Conversion failed: output file is invalid or empty');
    }

    // Clean up input file
    await fs.unlink(inputPath).catch(() => {});

    // Return success with file info
    // NOTE: Don't include /audiokonverter prefix - Vue app adds it automatically
    res.json({
      ok: true,
      url: `/files/${outputFilename}`,
      filename: outputFilename,
      size: stats.size
    });

  } catch (error) {
    console.error('Conversion error:', error);

    // Clean up files on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      ok: false,
      error: error.message || 'Conversion failed'
    });
  }
});

// Serve converted files - handler function
async function serveFile(req, res) {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);

    console.log('[Electron Backend] Serving file:', filename, 'from', filePath);

    // Check if file exists
    await fs.access(filePath);

    res.download(filePath, filename, async (err) => {
      if (err && !res.headersSent) {
        console.error('Download error:', err);
        res.status(500).json({ ok: false, error: 'Failed to download file' });
      }

      // Clean up file after download (optional)
      // await fs.unlink(filePath).catch(() => {});
    });

  } catch (error) {
    console.error('[Electron Backend] File access error:', error);
    res.status(404).json({ ok: false, error: 'File not found' });
  }
}

// Serve converted files - both routes (with and without /audiokonverter prefix)
app.get('/audiokonverter/files/:filename', serveFile);
app.get('/files/:filename', serveFile);

// Cleanup old files periodically (every hour)
setInterval(async () => {
  try {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const dir of [uploadsDir, outputDir]) {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Audio Konverter Backend running on http://localhost:${PORT}`);
  console.log(`FFmpeg path: ${getFFmpegPath()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
