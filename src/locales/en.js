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
    subtitle: 'Download our Windows desktop application and convert audio files offline on your computer.',
    downloadButton: 'Download',
    recommended: 'Recommended',
    systemRequirements: 'System Requirements: Windows 10 or newer (64-bit recommended)',
    securityWarning: {
      title: 'Important Notice about Windows Defender',
      description: 'Windows Defender may flag the installer files as a potential threat. This is a known false positive, as our app is not digitally signed.',
      learnMore: 'Learn more and view installation instructions',
      why: {
        title: 'Why does this happen?',
        description: 'Our software is completely safe, but Windows Defender classifies unknown programs without a digital certificate as suspicious. This is a precautionary measure by Microsoft to protect users.'
      },
      howToInstall: {
        title: 'How to install anyway:',
        steps: [
          'Download the desired file',
          'If Windows Defender shows a warning, click on "More info"',
          'Then click on "Run anyway" or "Keep anyway"',
          'Follow the installation instructions'
        ]
      },
      recommendation: 'Tip: The Portable version (ZIP) triggers antivirus warnings less often and requires no installation.'
    },
    windows: {
      exe: {
        name: 'Windows Installer (64-bit)',
        description: 'Recommended for most Windows users. Easy installation with automatic update functionality.'
      },
      msi64: {
        name: 'Windows MSI (64-bit)',
        description: 'Enterprise installer for corporate environments. Advanced installation options for IT administrators.'
      },
      msi32: {
        name: 'Windows MSI (32-bit)',
        description: 'For older Windows systems. Compatible with 32-bit Windows versions.'
      }
    },
    portable64: {
      name: 'Portable Version (64-bit)',
      description: 'No installation needed! Extract and run directly. Rarely triggers antivirus warnings.'
    },
    portable32: {
      name: 'Portable Version (32-bit)',
      description: 'ZIP archive for older systems. No installation required, runs from USB or local folder.'
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
