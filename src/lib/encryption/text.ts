import { createCipheriv, createDecipheriv } from "crypto";

/**
 * Déchiffre un texte encodé en base64 avec AES-256-CBC
 */
export const decryptText = (
  encryptedText: string,
  key: string,
  iv: string
): string => {
  try {
    const decipher = createDecipheriv(
      "aes-256-cbc",
      Buffer.from(key, "base64"),
      Buffer.from(iv, "base64")
    );

    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Erreur de déchiffrement:", error);
    return "Erreur de déchiffrement";
  }
};

/**
 * Chiffre un texte en AES-256-CBC et retourne le résultat en base64
 */
export const encryptText = (
  text: string,
  key: string,
  iv: string | Buffer
): string => {
  // On s'assure que l'IV est au bon format pour createCipheriv
  const ivBuffer = typeof iv === "string" ? Buffer.from(iv, "base64") : iv;

  const cipher = createCipheriv(
    "aes-256-cbc",
    Buffer.from(key, "base64"),
    ivBuffer
  );

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
};
