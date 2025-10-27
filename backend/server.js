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

// CORS configuration
app.use(cors());
app.use(express.json());

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

    const args = [
      '-i', inputPath,
      '-b:a', bitrate,
      '-y', // Overwrite output file
      outputPath
    ];

    console.log('FFmpeg command:', ffmpegPath, args.join(' '));

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

    // Clean up input file
    await fs.unlink(inputPath).catch(() => {});

    // Return success with file info
    res.json({
      ok: true,
      url: `/audiokonverter/files/${outputFilename}`,
      filename: outputFilename
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

// Serve converted files
app.get('/audiokonverter/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);

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
    console.error('File access error:', error);
    res.status(404).json({ ok: false, error: 'File not found' });
  }
});

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
