import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Ignore les variables inutilisées sauf si elles ne commencent pas par _
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],

      // Autorise les console.log (pratique en dev)
      "no-console": "off",

      // Désactive la règle qui interdit d'utiliser des any (TypeScript)
      "@typescript-eslint/no-explicit-any": "off",

      // Autorise les fonctions sans type de retour explicite (utile en dev)
      "@typescript-eslint/explicit-function-return-type": "off",

      // Autorise l'utilisation de variables avant leur déclaration (hoisting)
      "no-use-before-define": "off",

      "react/no-unescaped-entities": "off",

      // Permet d’utiliser des variables non camelCase
      camelcase: "off",

      // Autorise les expressions inutilisées (utile pour du debug)
      "no-unused-expressions": "off",

      // Désactive la règle qui impose d’importer React dans les fichiers JSX (Next.js gère ça)
      "react/react-in-jsx-scope": "off",

      "react/jsx-key": "off",
      "prefer-const": "off",
    },
  },
];

export default eslintConfig;
