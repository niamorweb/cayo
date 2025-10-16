import crypto from "crypto";

export const generateAESKey = () => {
  return crypto.randomBytes(32).toString("base64");
};

export const encryptAESKey = (aesKey: any, masterPassword: any) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(masterPassword, salt, 100000, 32, "sha256");
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(aesKey, "utf8", "base64");
  encrypted += cipher.final("base64");
  return {
    encryptedKey: encrypted,
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
  };
};

export const decryptAESKey = (
  encryptedKey: any,
  iv: any,
  salt: any,
  masterPassword: any
) => {
  const key = crypto.pbkdf2Sync(
    masterPassword,
    Buffer.from(salt, "base64"),
    100000,
    32,
    "sha256"
  );
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    key,
    Buffer.from(iv, "base64")
  );
  let decrypted = decipher.update(encryptedKey, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export async function decryptPrivateKey(
  encryptedPrivateKeyBase64: string,
  aesKeyBase64: string,
  ivBase64: string
  // ): Promise<ArrayBuffer> {
): Promise<any> {
  //   //   //
  const toBytes = (b64: string) =>
    Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const aesKeyBytes = toBytes(aesKeyBase64);
  const iv = toBytes(ivBase64);
  const encryptedPrivateKey = toBytes(encryptedPrivateKeyBase64);

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      encryptedPrivateKey
    );

    return decrypted; // PKCS8 (ArrayBuffer)
  }
}

export const encryptAesKeyWithPublicKey = async (
  aesKeyBase64: string,
  publicKeyBase64: string
): Promise<string> => {
  const aesKeyBytes = Uint8Array.from(atob(aesKeyBase64), (c) =>
    c.charCodeAt(0)
  );
  const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), (c) =>
    c.charCodeAt(0)
  );

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    aesKeyBytes
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

export const decryptAesKeyWithPrivateKey = async (
  encryptedAesKeyBase64: string,
  privateKeyBase64: string
): Promise<string> => {
  const encryptedBytes = Uint8Array.from(atob(encryptedAesKeyBase64), (c) =>
    c.charCodeAt(0)
  );
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) =>
    c.charCodeAt(0)
  );

  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBytes
  );

  return btoa(String.fromCharCode(...new Uint8Array(decrypted)));
};

// import crypto from 'crypto';
// import argon2 from 'argon2';  // N'oubliez pas d'installer le paquet argon2

// // Fonction pour générer une clé AES
// export const generateAESKey = () => {
//   return crypto.randomBytes(32); // Génère une clé de 256 bits pour AES
// };

// // Fonction pour chiffrer une clé AES avec un mot de passe maître
// export const encryptAESKey = async (aesKey, masterPassword) => {
//   // Génération d'un salt unique pour chaque chiffrement
//   const salt = crypto.randomBytes(16);

//   // Dérivation de la clé de chiffrement avec Argon2
//   const derivedKey = await argon2.hash(masterPassword, { salt, type: argon2.d });

//   // Génération d'un IV (vecteur d'initialisation) unique pour chaque chiffrement
//   const iv = crypto.randomBytes(12); // 12 bytes pour AES-GCM

//   // Création du cipher AES-GCM
//   const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);

//   // Chiffrement de la clé AES
//   let encrypted = cipher.update(aesKey, 'utf8', 'base64');
//   encrypted += cipher.final('base64');

//   // Récupération du tag d'authentification
//   const tag = cipher.getAuthTag();

//   return {
//     encryptedKey: encrypted,
//     iv: iv.toString('base64'),
//     salt: salt.toString('base64'),
//     tag: tag.toString('base64'),
//   };
// };

// // Fonction pour déchiffrer une clé AES avec un mot de passe maître
// export const decryptAESKey = async (encryptedKey, iv, salt, tag, masterPassword) => {
//   // Dérivation de la clé à partir du mot de passe maître et du salt
//   const derivedKey = await argon2.hash(masterPassword, { salt: Buffer.from(salt, 'base64'), type: argon2.d });

//   // Création du decipher AES-GCM
//   const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, Buffer.from(iv, 'base64'));
//   decipher.setAuthTag(Buffer.from(tag, 'base64'));  // Ajout du tag d'authentification

//   // Déchiffrement de la clé AES
//   let decrypted = decipher.update(encryptedKey, 'base64', 'utf8');
//   decrypted += decipher.final('utf8');

//   return decrypted;
// };
