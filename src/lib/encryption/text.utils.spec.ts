import { encryptText, decryptText } from "./text"; // 👈 Ajuste le chemin
import { randomBytes } from "crypto";

describe("Crypto Utilities (AES-256-CBC)", () => {
  // On génère des clés valides pour les tests
  // AES-256 nécessite une clé de 32 bytes
  const mockKey = randomBytes(32).toString("base64");
  // AES nécessite un IV de 16 bytes
  const mockIv = randomBytes(16).toString("base64");

  const plainText = "Ceci est un secret de famille 🤫";

  describe("encryptText", () => {
    it("devrait retourner une chaîne différente du texte original", () => {
      const encrypted = encryptText(plainText, mockKey, mockIv);
      expect(encrypted).not.toBe(plainText);
      expect(typeof encrypted).toBe("string");
    });

    it("devrait être déterministe (même input + même clé/iv = même output)", () => {
      const run1 = encryptText(plainText, mockKey, mockIv);
      const run2 = encryptText(plainText, mockKey, mockIv);
      expect(run1).toBe(run2);
    });

    it("devrait accepter un IV sous forme de Buffer", () => {
      const bufferIv = Buffer.from(mockIv, "base64");
      const encrypted = encryptText(plainText, mockKey, bufferIv);
      expect(typeof encrypted).toBe("string");
      // On vérifie que le résultat est déchiffrable avec l'IV string
      const decrypted = decryptText(encrypted, mockKey, mockIv);
      expect(decrypted).toBe(plainText);
    });
  });

  describe("decryptText", () => {
    it("devrait déchiffrer correctement un texte chiffré (Round Trip)", () => {
      // 1. Chiffrement
      const encrypted = encryptText(plainText, mockKey, mockIv);
      // 2. Déchiffrement
      const decrypted = decryptText(encrypted, mockKey, mockIv);

      // 3. Vérification
      expect(decrypted).toBe(plainText);
    });

    it("devrait échouer si la clé est incorrecte", () => {
      const encrypted = encryptText(plainText, mockKey, mockIv);
      const wrongKey = randomBytes(32).toString("base64");

      const result = decryptText(encrypted, wrongKey, mockIv);

      // Ta fonction catch l'erreur et retourne un string spécifique
      expect(result).toBe("Erreur de déchiffrement");
    });

    it("devrait échouer si l'IV est incorrect", () => {
      const encrypted = encryptText(plainText, mockKey, mockIv);
      const wrongIv = randomBytes(16).toString("base64");

      const result = decryptText(encrypted, mockKey, wrongIv);

      // On vérifie que le résultat est corrompu (différent de l'original)
      expect(result).not.toBe(plainText);
    });

    it("devrait échouer si le texte chiffré est corrompu", () => {
      const result = decryptText("NotARealEncryptedString==", mockKey, mockIv);
      expect(result).toBe("Erreur de déchiffrement");
    });
  });
});
