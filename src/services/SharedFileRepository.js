/**
 * Shared File Repository – IndexedDB bridge between KodiniTools apps.
 *
 * The converter writes converted audio blobs here; receiving tools
 * (Visualizer, Normalisierer, Equalizer) read from the same store
 * when opened with ?source=audiokonverter.
 */

const DB_NAME = 'kodinitools-shared-files'
const STORE_NAME = 'audio-files'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Store converted files for handoff to another tool.
 * Clears any previous entries first.
 *
 * @param {{ name: string, blob: Blob }[]} files
 */
export async function shareFiles(files) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)

  store.clear()

  for (const file of files) {
    store.put({
      name: file.name,
      blob: file.blob,
      mimeType: file.blob.type,
      source: 'audiokonverter',
      sharedAt: Date.now()
    })
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

/**
 * Read shared files (used by the receiving tool).
 * @returns {Promise<Array>}
 */
export async function getSharedFiles() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const request = tx.objectStore(STORE_NAME).getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => { db.close(); resolve(request.result) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

/**
 * Clear shared files after the receiving tool has consumed them.
 */
export async function clearSharedFiles() {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).clear()

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
