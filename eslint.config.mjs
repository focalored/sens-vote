import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    plugins: {
      prettier: require("eslint-plugin-prettier"),
    },
    rules: {
      "prettier/prettier": "error",
    },
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
  },
]);
