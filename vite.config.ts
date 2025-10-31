
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ВАЖНО: замени на имя своего репозитория, например "/samocvety-manager/"
  base: "/MANAGER-TEST/",
});
