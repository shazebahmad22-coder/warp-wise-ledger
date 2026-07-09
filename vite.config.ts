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
      // Chunks larger than this will trigger a warning
      chunkSizeWarningLimit: 1000,
      
      // Optimize chunking for better performance
      rollupOptions: {
        output: {
          // Manual chunk configuration to split vendor libraries
          manualChunks: {
            // UI Component libraries
            'radix-ui': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip',
            ],
            // Data and state management
            'data-libs': [
              '@tanstack/react-query',
              'zustand',
              'zod',
            ],
            // Form handling
            'forms': [
              'react-hook-form',
              '@hookform/resolvers',
            ],
            // Router and navigation
            'router': [
              '@tanstack/react-router',
              '@tanstack/react-start',
            ],
            // Charts and visualization
            'charts': [
              'recharts',
            ],
            // Supabase client
            'supabase': [
              '@supabase/supabase-js',
            ],
            // Utility and UI helpers
            'utils': [
              'clsx',
              'tailwind-merge',
              'cmdk',
              'class-variance-authority',
              'lucide-react',
              'sonner',
            ],
            // Date handling
            'dates': [
              'date-fns',
              'react-day-picker',
            ],
          },
        },
      },
    },
  },
});
