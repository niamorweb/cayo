/**
 * ⚠️ SETUP GLOBAL CRITIQUE
 * Ce bloc permet de simuler l'environnement du navigateur (window.crypto, atob, btoa)
 * dans l'environnement Node.js de Jest.
 */
const { webcrypto } = require("node:crypto");
const { TextEncoder, TextDecoder } = require("util");

// Configuration de 'window' pour simuler le navigateur si absent
if (typeof window === "undefined") {
  // @ts-ignore
  global.window = global;
}

// Injection des API Web Crypto et utilitaires dans l'objet global
Object.defineProperties(global, {
  crypto: { value: webcrypto, writable: true },
  TextEncoder: { value: TextEncoder, writable: true },
  TextDecoder: { value: TextDecoder, writable: true },
  // Polyfill pour atob/btoa (natif dans Node > 16 mais parfois manquant dans JSDOM)
  atob: {
    value:
      global.atob ||
      ((str: string) => Buffer.from(str, "base64").toString("binary")),
    writable: true,
  },
  btoa: {
    value:
      global.btoa ||
      ((str: string) => Buffer.from(str, "binary").toString("base64")),
    writable: true,
  },
});

// Importez votre fichier APRÈS le setup ci-dessus
import * as hybridCrypto from "./aes"; // 👈 AJUSTEZ LE CHEMIN ICI

describe("Hybrid Crypto Utilities", () => {
  // ==========================================================
  // Partie 1 : Tests Node.js (crypto classique - AES CBC & PBKDF2)
  // ==========================================================
  describe("Node.js Legacy Crypto (PBKDF2 + AES-CBC)", () => {
    const masterPassword = "mon-super-mot-de-passe-maitre";

    it("devrait générer une clé AES aléatoire valide", () => {
      const key = hybridCrypto.generateAESKey();
      expect(typeof key).toBe("string");
      // 32 bytes en base64 font environ 44 caractères
      expect(key.length).toBeGreaterThan(30);
    });

    it("devrait chiffrer et déchiffrer une clé AES avec un mot de passe maître", () => {
      const originalAesKey = hybridCrypto.generateAESKey();

      // 1. Chiffrement (Key Wrap avec PBKDF2)
      const wrapped = hybridCrypto.encryptAESKey(
        originalAesKey,
        masterPassword
      );

      expect(wrapped.encryptedKey).toBeDefined();
      expect(wrapped.iv).toBeDefined();
      expect(wrapped.salt).toBeDefined();
      expect(wrapped.encryptedKey).not.toBe(originalAesKey);

      // 2. Déchiffrement (Unwrap)
      const unwrappedKey = hybridCrypto.decryptAESKey(
        wrapped.encryptedKey,
        wrapped.iv,
        wrapped.salt,
        masterPassword
      );

      expect(unwrappedKey).toBe(originalAesKey);
    });

    it("ne devrait pas déchiffrer correctement si le mot de passe maître est faux", () => {
      const originalAesKey = hybridCrypto.generateAESKey();
      const wrapped = hybridCrypto.encryptAESKey(
        originalAesKey,
        masterPassword
      );

      // En AES-CBC, un mauvais mot de passe produit soit une erreur de padding,
      // soit un résultat corrompu (garbage). On gère les deux cas.
      try {
        const result = hybridCrypto.decryptAESKey(
          wrapped.encryptedKey,
          wrapped.iv,
          wrapped.salt,
          "mauvais-mot-de-passe"
        );
        expect(result).not.toBe(originalAesKey);
      } catch (e) {
        // Une erreur est aussi un succès ici (padding invalide)
        expect(e).toBeDefined();
      }
    });
  });

  // ==========================================================
  // Partie 2 : Tests Web Crypto API (RSA-OAEP & AES-GCM)
  // ==========================================================
  describe("Web Crypto API (RSA-OAEP & AES-GCM)", () => {
    // Helper pour générer des clés RSA valides pour les tests via WebCrypto
    const generateTestRsaKeys = async () => {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const pubBuffer = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const privBuffer = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      return {
        publicKeyBase64: Buffer.from(pubBuffer).toString("base64"),
        privateKeyBase64: Buffer.from(privBuffer).toString("base64"),
      };
    };

    it("devrait chiffrer et déchiffrer une clé AES via RSA (Key Envelope)", async () => {
      const { publicKeyBase64, privateKeyBase64 } = await generateTestRsaKeys();
      const aesKeyToProtect = hybridCrypto.generateAESKey(); // String Base64

      // 1. Chiffrement de la clé AES avec la clé Publique RSA
      const encryptedAesKey = await hybridCrypto.encryptAesKeyWithPublicKey(
        aesKeyToProtect,
        publicKeyBase64
      );

      expect(typeof encryptedAesKey).toBe("string");
      expect(encryptedAesKey).not.toBe(aesKeyToProtect);

      // 2. Déchiffrement avec la clé Privée RSA
      const decryptedAesKey = await hybridCrypto.decryptAesKeyWithPrivateKey(
        encryptedAesKey,
        privateKeyBase64
      );

      expect(decryptedAesKey).toBe(aesKeyToProtect);
    });

    it("decryptPrivateKey devrait déchiffrer une clé privée chiffrée en AES-GCM", async () => {
      // Pour tester cette fonction, on doit simuler un input valide.
      // Scénario : On a une clé privée RSA (cible) qu'on veut protéger avec une clé AES (KEK).

      // 1. Setup : Générer la clé privée cible
      const { privateKeyBase64 } = await generateTestRsaKeys();

      // 2. Setup : Générer la clé AES de chiffrement (KEK)
      const kekAesKeyBase64 = hybridCrypto.generateAESKey();

      // 3. Setup : Chiffrer manuellement la clé privée cible avec la clé AES
      // (On reproduit l'inverse de la fonction decryptPrivateKey pour créer la donnée de test)
      const kekBytes = Uint8Array.from(atob(kekAesKeyBase64), (c) =>
        c.charCodeAt(0)
      );
      const privKeyBytes = Uint8Array.from(atob(privateKeyBase64), (c) =>
        c.charCodeAt(0)
      );
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const kekKeyObj = await window.crypto.subtle.importKey(
        "raw",
        kekBytes,
        "AES-GCM",
        false,
        ["encrypt"]
      );

      const encryptedPrivKeyBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        kekKeyObj,
        privKeyBytes
      );

      const encryptedPrivKeyBase64 = Buffer.from(
        encryptedPrivKeyBuffer
      ).toString("base64");
      const ivBase64 = Buffer.from(iv).toString("base64");

      // -----------------------------------------------------
      // 4. Test réel de la fonction decryptPrivateKey
      // -----------------------------------------------------
      const resultBuffer = await hybridCrypto.decryptPrivateKey(
        encryptedPrivKeyBase64,
        kekAesKeyBase64,
        ivBase64
      );

      // 5. Vérification
      // Le résultat est un ArrayBuffer (PKCS8), on le reconvertit en Base64 pour comparer
      const resultBase64 = Buffer.from(resultBuffer).toString("base64");
      expect(resultBase64).toBe(privateKeyBase64);
    });
  });
});
