export default {
  app: {
    title: '🎵 Audio Converter',
    subtitle: 'Fast & easy conversion'
  },
  nav: {
    home: '🏠 Home',
    toggleTheme: '🎨 Theme',
    language: '🌍 Language'
  },
  upload: {
    title: '📁 Upload',
    dragDrop: '📂 Drop files here or click to browse',
    supportedFormats: 'MP3 • WAV • FLAC • OGG • AAC • M4A',
    selectFiles: '📁 Choose files',
    filesSelected: '{count} file | {count} files'
  },
  conversion: {
    title: '⚙️ Settings',
    format: '🎯 Format',
    quality: '✨ Quality',
    qualityLevels: {
      low: '📉 Low',
      medium: '📊 Medium',
      high: '📈 High',
      maximum: '🚀 Maximum'
    },
    convert: '🔄 Convert',
    converting: '⏳ Converting...',
    progress: '📊 Progress'
  },
  fileList: {
    title: '📋 Files',
    empty: 'No files yet',
    remove: '🗑️',
    size: '📦 Size'
  },
  actions: {
    clearAll: '🗑️ Clear',
    downloadAll: '⬇️ Download All',
    downloading: '⏳ Downloading...',
    downloadAllAsZip: '📦 ZIP Download',
    creatingZip: '⏳ Creating ZIP...',
    downloadOptions: '⬇️ Download',
    exportMetadata: '📄 Metadata',
    download: '⬇️',
    retry: '🔄'
  },
  status: {
    processing: '⏳ Processing...',
    completed: '✅ Done',
    error: '❌ Error',
    ready: '🟢 Ready',
    waiting: '⏸️ Waiting...'
  },
  toast: {
    success: '✅ Success',
    error: '❌ Error',
    warning: '⚠️ Warning',
    info: 'ℹ️ Info',
    fileAdded: '✅ Added',
    fileRemoved: '🗑️ Removed',
    conversionComplete: '🎉 Done!',
    conversionFailed: '❌ Failed',
    allFilesCleared: '🗑️ All cleared',
    unsupportedFormat: '⚠️ Format not supported',
    noFilesToDownload: '📭 No files to download',
    zipDownloadStarted: '📦 ZIP download started',
    zipDownloadFailed: '❌ ZIP download failed',
    allFilesDownloaded: '✅ All files downloaded',
    downloadFailed: '❌ Download failed'
  },
  errors: {
    uploadFailed: '❌ Upload failed',
    conversionFailed: '❌ Conversion failed',
    noFiles: '📭 No files',
    fileTooLarge: '📦 Too large (max. 300MB)',
    networkError: '🌐 Network error',
    serverError: '🖥️ Server error',
    unsupportedFile: '⚠️ Not supported'
  },
  download: {
    title: '⬇️ Download',
    subtitle: 'Download the desktop version',
    installer: {
      title: 'Windows Installer',
      description: 'Recommended for most users. Automatic installation with start menu entries.',
      exe: 'Download (.exe)'
    },
    portable: {
      title: 'Portable Version',
      description: 'No installation required. Ideal for USB drives or restricted systems.',
      x64: 'ZIP (64-bit)',
      x86: 'ZIP (32-bit)'
    },
    note: 'All downloads are virus-free and digitally signed.'
  },
  faq: {
    title: '❓ FAQ',
    questions: {
      formats: {
        q: '🎵 Which formats?',
        a: 'MP3, WAV, FLAC, OGG, AAC and M4A are supported.'
      },
      quality: {
        q: '✨ What does quality mean?',
        a: 'Higher quality = better sound, larger file.'
      },
      privacy: {
        q: '🔒 Are my files safe?',
        a: 'Yes! Files are automatically deleted after conversion.'
      },
      batch: {
        q: '📚 Multiple files at once?',
        a: 'Sure! Just upload multiple files.'
      }
    }
  }
}
