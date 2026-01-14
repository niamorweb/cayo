// jest.setup.ts
import { webcrypto } from "node:crypto";
import { TextEncoder, TextDecoder } from "node:util";

// On définit crypto.subtle globalement pour l'environnement Node/Jest
if (!global.crypto) {
  Object.defineProperty(global, "crypto", {
    value: webcrypto,
    writable: true,
  });
}

// On définit TextEncoder et TextDecoder qui manquent souvent dans JSDOM
if (typeof global.TextEncoder === "undefined") {
  Object.defineProperty(global, "TextEncoder", {
    value: TextEncoder,
    writable: true,
  });
  Object.defineProperty(global, "TextDecoder", {
    value: TextDecoder,
    writable: true,
  });
}
