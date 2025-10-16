import CryptoJS from "crypto-js";

// Fonction pour générer un sel aléatoire
function generateSalt() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
}

// Fonction pour générer un padding aléatoire
function generatePadding() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex);
}

// Fonction pour dériver une clé AES à partir d'un mot de passe maître et d'un sel
function deriveAESKey(masterPassword: any, salt: any) {
  return CryptoJS.PBKDF2(masterPassword, CryptoJS.enc.Hex.parse(salt), {
    keySize: 256 / 32,
    iterations: 1000,
  });
}

// Fonction pour chiffrer une clé AES
function encryptAESKey(aesKey: any, encryptionKey: any) {
  return CryptoJS.AES.encrypt(
    aesKey.toString(CryptoJS.enc.Hex),
    encryptionKey
  ).toString();
}

// Mot de passe maître (à remplacer par une saisie utilisateur sécurisée)
const masterPassword = "supersecretpassword";

// Générer un sel et un padding
const salt = generateSalt();
const padding = generatePadding();

// Dériver une clé AES à partir du mot de passe maître et du sel
const aesKey = deriveAESKey(masterPassword, salt);

// Chiffrer la clé AES avec une clé de chiffrement (par exemple, une autre clé AES dérivée)
const encryptionKey = deriveAESKey(masterPassword + padding, salt); // Exemple de clé de chiffrement dérivée
const encryptedAESKey = encryptAESKey(aesKey, encryptionKey);

// Afficher les résultats
console.log("Clé AES dérivée :", aesKey.toString(CryptoJS.enc.Hex));
