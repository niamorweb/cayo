export const generateRsaKeyPair = async () => {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
};

export const exportKeyToBase64 = async (
  key: CryptoKey,
  format: "spki" | "pkcs8"
): Promise<string> => {
  const exported = await crypto.subtle.exportKey(format, key);
  return bufferToBase64(exported);
};

export const importAesKeyFromBase64 = async (
  base64: string
): Promise<CryptoKey> => {
  const raw = base64ToBuffer(base64);
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
};

export const encryptWithAes = async (
  data: ArrayBuffer,
  aesKey: CryptoKey
): Promise<{ cipher: ArrayBuffer; iv: Uint8Array }> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    aesKey,
    data
  );
  return { cipher, iv };
};

export const decryptWithAes = async (
  cipher: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> => {
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    aesKey,
    cipher
  );
};

export const importRsaPrivateKey = async (
  base64: string
): Promise<CryptoKey> => {
  const buffer = base64ToBuffer(base64);
  return crypto.subtle.importKey(
    "pkcs8",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
};

export const importRsaPublicKey = async (
  base64: string
): Promise<CryptoKey> => {
  const buffer = base64ToBuffer(base64);
  return crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
};

export const encryptWithRsaPublicKey = async (
  plaintextBase64: string,
  publicKeyBase64: string
): Promise<string> => {
  const publicKey = await importRsaPublicKey(publicKeyBase64);
  const plainBuffer = base64ToBuffer(plaintextBase64);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    plainBuffer
  );
  return bufferToBase64(encrypted);
};

export const decryptWithRsaPrivateKey = async (
  encryptedBase64: string,
  privateKeyBase64: string
): Promise<string> => {
  const privateKey = await importRsaPrivateKey(privateKeyBase64);
  const encrypted = base64ToBuffer(encryptedBase64);
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encrypted
  );
  return bufferToBase64(decrypted);
};

// Helpers
export const bufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};
