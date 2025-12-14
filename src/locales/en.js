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
    downloadAllAsZip: 'Download All as ZIP',
    creatingZip: 'Creating ZIP...',
    downloadOptions: 'Download Options',
    exportMetadata: 'Export Metadata',
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
    noFilesToDownload: 'No converted files to download',
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
