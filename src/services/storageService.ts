import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads a local image URI (from expo-image-picker) to Firebase Storage
 * and returns a permanent public HTTPS download URL.
 *
 * @param localUri  - The `file://...` URI returned by expo-image-picker
 * @param path      - Storage path, e.g. `recipes/user123/cover.jpg`
 * @param onProgress - Optional callback receiving 0–100 progress value
 */
export async function uploadImageToStorage(
  localUri: string,
  path: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  // Fetch the local file as a blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, blob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(pct);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}
