import { createCipheriv, createDecipheriv } from "crypto";

const decryptText = (encryptedText: any, key: any, iv: any) => {
  //   //   //
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
    // console.error("Erreur de déchiffrement:", error);
    return "Erreur de déchiffrement"; // Vous pouvez retourner une chaîne par défaut ou laisser un message d'erreur
  }
};

const encryptText = (text: any, key: any, iv: any) => {
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key, "base64"), iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Retourner l'IV et le texte chiffré ensemble
  return encrypted;
};

export { decryptText, encryptText };
