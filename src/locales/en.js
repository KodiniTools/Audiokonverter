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
    downloadAsZip: 'Download as ZIP',
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
    unsupportedFormat: 'Unsupported format',
    zipDownloadStarted: 'ZIP download started',
    zipDownloadFailed: 'ZIP download failed'
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
  },
  licenses: {
    title: 'Open Source Licenses',
    subtitle: 'This application uses the following open-source libraries and tools',
    homepage: 'Homepage',
    licenseText: 'License Text',
    footer: 'We thank all open-source developers for their amazing work. All trademarks and names mentioned belong to their respective owners.',
    items: {
      vue: {
        name: 'Vue.js',
        type: 'MIT License',
        description: 'The progressive JavaScript framework for building modern user interfaces. Vue.js is the heart of this application.',
        url: 'https://vuejs.org',
        licenseUrl: 'https://github.com/vuejs/core/blob/main/LICENSE'
      },
      vite: {
        name: 'Vite',
        type: 'MIT License',
        description: 'Modern frontend build tool with blazing fast Hot Module Replacement (HMR) for an optimal developer experience.',
        url: 'https://vitejs.dev',
        licenseUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE'
      },
      pinia: {
        name: 'Pinia',
        type: 'MIT License',
        description: 'Intuitive, type-safe state management for Vue.js. Pinia manages the entire application state.',
        url: 'https://pinia.vuejs.org',
        licenseUrl: 'https://github.com/vuejs/pinia/blob/v2/LICENSE'
      },
      vueI18n: {
        name: 'Vue I18n',
        type: 'MIT License',
        description: 'Internationalization plugin for Vue.js, enabling the multilingual support of this application.',
        url: 'https://vue-i18n.intlify.dev',
        licenseUrl: 'https://github.com/intlify/vue-i18n-next/blob/master/LICENSE'
      },
      axios: {
        name: 'Axios',
        type: 'MIT License',
        description: 'Promise-based HTTP client for browsers and Node.js for communication with the backend server.',
        url: 'https://axios-http.com',
        licenseUrl: 'https://github.com/axios/axios/blob/v1.x/LICENSE'
      },
      jszip: {
        name: 'JSZip',
        type: 'MIT / GPL-3.0',
        description: 'JavaScript library for creating, reading and editing ZIP files, used for the "Download as ZIP" feature.',
        url: 'https://stuk.github.io/jszip',
        licenseUrl: 'https://github.com/Stuk/jszip/blob/main/LICENSE.markdown'
      },
      fontawesome: {
        name: 'Font Awesome',
        type: 'Font: SIL OFL 1.1 / Icons: CC BY 4.0 / Code: MIT',
        description: 'Comprehensive icon library with thousands of icons for a modern and intuitive user interface.',
        url: 'https://fontawesome.com',
        licenseUrl: 'https://fontawesome.com/license/free'
      },
      ffmpeg: {
        name: 'FFmpeg',
        type: 'LGPL 2.1+ / GPL 2+',
        description: 'Powerful multimedia framework for decoding, encoding and converting audio and video files. FFmpeg is the conversion engine of the backend.',
        url: 'https://ffmpeg.org',
        licenseUrl: 'https://ffmpeg.org/legal.html'
      },
      nodejs: {
        name: 'Node.js',
        type: 'MIT License',
        description: 'JavaScript runtime environment that powers the backend of this application and enables server-side processing.',
        url: 'https://nodejs.org',
        licenseUrl: 'https://github.com/nodejs/node/blob/main/LICENSE'
      },
      express: {
        name: 'Express.js',
        type: 'MIT License',
        description: 'Minimal and flexible Node.js web application framework for the backend API endpoints.',
        url: 'https://expressjs.com',
        licenseUrl: 'https://github.com/expressjs/express/blob/master/LICENSE'
      },
      multer: {
        name: 'Multer',
        type: 'MIT License',
        description: 'Node.js middleware for handling multipart/form-data, used for file uploads.',
        url: 'https://github.com/expressjs/multer',
        licenseUrl: 'https://github.com/expressjs/multer/blob/master/LICENSE'
      },
      repository: {
        name: 'Audio Converter - Source Code',
        type: 'Open Source',
        description: 'The complete source code of this application is publicly available on GitHub. Contributions, issues, and feedback are welcome!',
        url: 'https://github.com/KodiniTools/Audiokonverter',
        licenseUrl: 'https://github.com/KodiniTools/Audiokonverter/blob/main/LICENSE'
      }
    }
  }
}
