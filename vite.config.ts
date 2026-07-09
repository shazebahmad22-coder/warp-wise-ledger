// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    build: {
      // Increase chunk size warning limit (in kB)
      chunkSizeWarningLimit: 1000,
      
      rollupOptions: {
        output: {
          // Rolldown requires manualChunks to be a function, not an object
          manualChunks: (id) => {
            // UI Component libraries
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            
            // Data and state management
            if (id.includes('@tanstack/react-query') || id.includes('zustand') || id.includes('zod')) {
              return 'data-libs';
            }
            
            // Form handling
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers')) {
              return 'forms';
            }
            
            // Router and navigation
            if (id.includes('@tanstack/react-router') || id.includes('@tanstack/react-start')) {
              return 'router';
            }
            
            // Charts and visualization
            if (id.includes('recharts')) {
              return 'charts';
            }
            
            // Supabase client
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            
            // Utility and UI helpers
            if (id.includes('clsx') || 
                id.includes('tailwind-merge') || 
                id.includes('cmdk') || 
                id.includes('class-variance-authority') || 
                id.includes('lucide-react') || 
                id.includes('sonner')) {
              return 'utils';
            }
            
            // Date handling
            if (id.includes('date-fns') || id.includes('react-day-picker')) {
              return 'dates';
            }
          },
        },
      },
    },
    resolve: {
      // Use Vite's native tsconfig paths resolution instead of plugin
      tsconfigPaths: true,
    },
  },
});
