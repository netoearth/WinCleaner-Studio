import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// Virtual shim plugin for react-is to prevent Vite import-analysis failure in Recharts
const reactIsShimPlugin: Plugin = {
  name: 'virtual-react-is-shim',
  enforce: 'pre',
  resolveId(id: string) {
    if (id === 'react-is' || id.endsWith('/react-is') || id.includes('node_modules/react-is')) {
      return '\0virtual:react-is';
    }
    return null;
  },
  load(id: string) {
    if (id === '\0virtual:react-is') {
      return `
        export const isFragment = (val) => Boolean(val && val.type && val.type.toString() === 'Symbol(react.fragment)');
        export const isValidElementType = (val) => typeof val === 'string' || typeof val === 'function' || Boolean(val && typeof val === 'object');
        export const isContextConsumer = () => false;
        export const isContextProvider = () => false;
        export const isElement = (val) => Boolean(val && typeof val === 'object' && 'type' in val);
        export const isForwardRef = (val) => Boolean(val && val.$$typeof && val.$$typeof.toString().includes('react.forward_ref'));
        export const isLazy = () => false;
        export const isMemo = (val) => Boolean(val && val.$$typeof && val.$$typeof.toString().includes('react.memo'));
        export const isPortal = () => false;
        export const isProfiler = () => false;
        export const isStrictMode = () => false;
        export const isSuspense = () => false;
        export const ForwardRef = Symbol.for('react.forward_ref');
        export const Memo = Symbol.for('react.memo');
        export const Fragment = Symbol.for('react.fragment');
        export default {
          isFragment,
          isValidElementType,
          isContextConsumer,
          isContextProvider,
          isElement,
          isForwardRef,
          isLazy,
          isMemo,
          isPortal,
          isProfiler,
          isStrictMode,
          isSuspense,
          ForwardRef,
          Memo,
          Fragment,
        };
      `;
    }
    return null;
  },
};

export default defineConfig(() => {
  return {
    plugins: [reactIsShimPlugin, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-is': '\0virtual:react-is',
      },
    },
    optimizeDeps: {
      exclude: ['react-is'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
