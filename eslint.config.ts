import { defineConfig } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"

export default defineConfig([
  ...medusa.configs.recommended,
  {
    rules: {
      "@medusajs/step-id-kebab-case": "off",
    }
  }
])
