export default {
  app: {
    title: 'Audio Converter',
    subtitle: 'Convert your audio files quickly and easily'
  },
  nav: {
    home: 'Home',
    toggleTheme: 'Toggle Theme',
    language: 'Language'
  },
  upload: {
    title: 'Upload Files',
    dragDrop: 'Drag files here or click to select',
    supportedFormats: 'Supported formats: MP3, WAV, FLAC, OGG, AAC, M4A',
    selectFiles: 'Select Files',
    filesSelected: '{count} file selected | {count} files selected'
  },
  conversion: {
    title: 'Conversion Settings',
    format: 'Target Format',
    quality: 'Quality',
    qualityLevels: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      maximum: 'Maximum'
    },
    convert: 'Convert',
    converting: 'Converting...',
    progress: 'Progress'
  },
  fileList: {
    title: 'Selected Files',
    empty: 'No files selected',
    remove: 'Remove',
    size: 'Size'
  },
  actions: {
    clearAll: 'Clear All',
    downloadAll: 'Download All',
    downloadOptions: 'Download Options',
    exportMetadata: 'Export Metadata',
    undo: 'Undo',
    redo: 'Redo',
    download: 'Download',
    retry: 'Retry'
  },
  status: {
    processing: 'Processing...',
    completed: 'Completed',
    error: 'Error',
    ready: 'Ready',
    waiting: 'Waiting...'
  },
  toast: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    fileAdded: 'File added',
    fileRemoved: 'File removed',
    conversionComplete: 'Conversion complete',
    conversionFailed: 'Conversion failed',
    allFilesCleared: 'All files cleared',
    unsupportedFormat: 'Unsupported format'
  },
  errors: {
    uploadFailed: 'Upload failed',
    conversionFailed: 'Conversion failed',
    noFiles: 'No files selected',
    fileTooLarge: 'File too large (max. 300MB)',
    networkError: 'Network error',
    serverError: 'Server error',
    unsupportedFile: 'Unsupported file'
  },
  downloads: {
    title: 'Download Desktop App',
    subtitle: 'Download our desktop application and convert audio files offline on your computer. Available for Windows, macOS and Linux.',
    downloadButton: 'Download',
    systemRequirements: 'System Requirements: Windows 10+, macOS 10.14+, or modern Linux distribution',
    windows: {
      exe: {
        name: 'Windows Installer',
        description: 'Recommended for most Windows users. Easy installation with automatic update functionality.'
      },
      msi: {
        name: 'Windows MSI',
        description: 'Enterprise installer for corporate environments with advanced installation options.'
      }
    },
    macos: {
      name: 'macOS App',
      description: 'For Apple Mac with Intel or Apple Silicon. Optimized for macOS Monterey and later.'
    },
    linux: {
      deb: {
        name: 'Linux DEB',
        description: 'For Debian, Ubuntu and derived distributions. Easy installation with dpkg.'
      },
      appimage: {
        name: 'Linux AppImage',
        description: 'Universal format for all Linux distributions. No installation required.'
      }
    },
    portable: {
      name: 'Portable Version',
      description: 'ZIP archive without installation. Perfect for USB drives or temporary use.'
    }
  },
  faq: {
    title: 'Frequently Asked Questions',
    questions: {
      formats: {
        q: 'Which formats are supported?',
        a: 'We support MP3, WAV, FLAC, OGG, AAC and M4A formats.'
      },
      quality: {
        q: 'What do the quality levels mean?',
        a: 'Quality determines the bitrate and compression of the output file. Higher quality means better sound but larger files.'
      },
      privacy: {
        q: 'Are my files safe?',
        a: 'Yes, all files are only processed temporarily and automatically deleted after conversion.'
      },
      batch: {
        q: 'Can I convert multiple files at once?',
        a: 'Yes, you can upload multiple files and they will be converted sequentially.'
      }
    }
  }
}
