/**
 * ⚠️ BLOCK DE SETUP CRITIQUE (A mettre tout en haut)
 * On force l'utilisation du module crypto de Node.js à la place de celui de JSDOM
 * qui est incomplet. On utilise 'require' pour passer avant les imports.
 */
const { webcrypto } = require("node:crypto");
const { TextEncoder, TextDecoder } = require("util");

Object.defineProperties(globalThis, {
  crypto: { value: webcrypto, writable: true },
  TextEncoder: { value: TextEncoder, writable: true },
  TextDecoder: { value: TextDecoder, writable: true },
});

// --------------------------------------------------------
// Tes imports normaux commencent ici
// --------------------------------------------------------
import * as cryptoUtils from "./rsa"; // 👈 Vérifie que le chemin est bon (ex: './rsa' ou './crypto.utils')

describe("WebCrypto Utilities", () => {
  describe("RSA Key Management", () => {
    it("devrait générer, exporter et ré-importer une paire de clés RSA", async () => {
      const keyPair = await cryptoUtils.generateRsaKeyPair();

      // Vérifications basiques
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.type).toBe("public");
      expect(keyPair.privateKey.type).toBe("private");

      // Export
      const pubBase64 = await cryptoUtils.exportKeyToBase64(
        keyPair.publicKey,
        "spki"
      );
      const privBase64 = await cryptoUtils.exportKeyToBase64(
        keyPair.privateKey,
        "pkcs8"
      );

      expect(typeof pubBase64).toBe("string");
      expect(pubBase64.length).toBeGreaterThan(0);

      // Import
      const importedPub = await cryptoUtils.importRsaPublicKey(pubBase64);
      expect(importedPub).toBeDefined();
      expect(importedPub.algorithm.name).toBe("RSA-OAEP");
    });

    it("devrait effectuer un cycle complet (chiffrement -> déchiffrement) RSA", async () => {
      const keyPair = await cryptoUtils.generateRsaKeyPair();
      const pubBase64 = await cryptoUtils.exportKeyToBase64(
        keyPair.publicKey,
        "spki"
      );
      const privBase64 = await cryptoUtils.exportKeyToBase64(
        keyPair.privateKey,
        "pkcs8"
      );

      const secretMessage = "Message ultra secret 🤐";
      // Attention : encryptWithRsaPublicKey attend du Base64 en entrée selon ton code
      const secretMessageBase64 = Buffer.from(secretMessage).toString("base64");

      // 1. Chiffrement
      const encryptedBase64 = await cryptoUtils.encryptWithRsaPublicKey(
        secretMessageBase64,
        pubBase64
      );
      expect(encryptedBase64).not.toBe(secretMessageBase64);

      // 2. Déchiffrement
      const decryptedBase64 = await cryptoUtils.decryptWithRsaPrivateKey(
        encryptedBase64,
        privBase64
      );

      // 3. Conversion finale pour vérifier le texte
      const decryptedMessage = Buffer.from(decryptedBase64, "base64").toString(
        "utf-8"
      );
      expect(decryptedMessage).toBe(secretMessage);
    });
  });

  describe("AES-GCM (Symmetric Encryption)", () => {
    it("devrait chiffrer et déchiffrer des données en AES-GCM", async () => {
      // On génère une clé AES valide pour le test via WebCrypto directement
      const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const data = new TextEncoder().encode("Données sensibles")
        .buffer as ArrayBuffer;

      // Chiffrement
      const { cipher, iv } = await cryptoUtils.encryptWithAes(data, aesKey);

      // Déchiffrement
      const decryptedBuffer = await cryptoUtils.decryptWithAes(
        cipher,
        aesKey,
        iv
      );
      const decryptedText = new TextDecoder().decode(decryptedBuffer);

      expect(decryptedText).toBe("Données sensibles");
    });

    it("devrait échouer au déchiffrement si l'IV est modifié (GCM Integrity)", async () => {
      const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const data = new TextEncoder().encode("Test Integrity")
        .buffer as ArrayBuffer;

      const { cipher, iv } = await cryptoUtils.encryptWithAes(data, aesKey);

      // Corruption de l'IV (on clone pour ne pas modifier l'original)
      const tamperedIv = new Uint8Array(iv);
      tamperedIv[0] = tamperedIv[0] ^ 1; // Inverse un bit

      // AES-GCM doit lancer une erreur
      await expect(
        cryptoUtils.decryptWithAes(cipher, aesKey, tamperedIv)
      ).rejects.toThrow();
    });
  });
});
