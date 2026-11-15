// Réglages de Vite (outil qui assemble l'app) et de Vitest (outil qui lance les tests).
import { defineConfig } from 'vitest/config'; // defineConfig apporte l'autocomplétion pour les deux outils

export default defineConfig({
  // Le site est servi à la racine de myrpgapp.thierry-morin.com, donc la base est "/".
  base: '/',
  build: {
    // Dossier produit par "npm run build" et publié sur GitHub Pages.
    outDir: 'dist',
    // La bibliothèque 3D est lourde : on la met dans son propre fichier pour que le cache la garde entre deux versions.
    rollupOptions: { output: { manualChunks: (id: string) => (id.includes('node_modules/three') ? 'three' : undefined) } },
    // Évite un avertissement inutile : le fichier 3D dépasse 500 ko, c'est attendu.
    chunkSizeWarningLimit: 800,
  },
  test: {
    // Les tests vivent à côté du code, dans des fichiers *.test.ts.
    include: ['src/**/*.test.ts'],
    // Environnement Node : la logique testée n'a besoin ni du navigateur ni du DOM.
    environment: 'node',
  },
});
