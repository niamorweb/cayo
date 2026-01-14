import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Chemin vers ton app Next.js pour charger les variables d'environnement, etc.
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  // Ajoute plus d'options de configuration ici si nécessaire
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
