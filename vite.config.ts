import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwind from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/target/**",
        "cimball-arduino/**",
        "cimball-broker/**",
        "server/**",
      ],
    },

    allowedHosts: true,
  },
});
