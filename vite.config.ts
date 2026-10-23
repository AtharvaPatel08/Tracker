import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function suppressHmrErrorsPlugin() {
  const scriptContent = `
    (function() {
      // Suppress Vite HMR WebSocket connection failure in environments where HMR is disabled
      const origError = console.error;
      console.error = function(...args) {
        const msg = args.map(a => (a && a.message) || String(a || '')).join(' ');
        if (msg.includes('[vite]') || msg.includes('WebSocket') || msg.includes('closed without opened')) {
          return;
        }
        origError.apply(console, args);
      };

      window.addEventListener('unhandledrejection', function(event) {
        if (
          event &&
          event.reason &&
          (event.reason.message?.includes('WebSocket') ||
            event.reason.message?.includes('closed without opened') ||
            event.reason?.stack?.includes('@vite/client'))
        ) {
          event.preventDefault();
          event.stopImmediatePropagation?.();
        }
      });

      window.addEventListener('error', function(event) {
        if (
          event &&
          (event.message?.includes('WebSocket') ||
            event.filename?.includes('@vite/client') ||
            event.error?.stack?.includes('@vite/client'))
        ) {
          event.preventDefault();
          event.stopImmediatePropagation?.();
        }
      });

      const NativeWebSocket = window.WebSocket;
      if (!NativeWebSocket) return;

      class ViteMockWebSocket extends EventTarget {
        static CONNECTING = 0;
        static OPEN = 1;
        static CLOSING = 2;
        static CLOSED = 3;

        CONNECTING = 0;
        OPEN = 1;
        CLOSING = 2;
        CLOSED = 3;

        readyState = 1;
        url = '';
        protocol = '';
        extensions = '';
        bufferedAmount = 0;
        binaryType = 'blob';

        onopen = null;
        onclose = null;
        onmessage = null;
        onerror = null;

        constructor(url, protocols) {
          super();
          this.url = String(url);
          this.protocol = Array.isArray(protocols) ? protocols[0] || '' : (protocols || '');
          queueMicrotask(() => {
            const ev = new Event('open');
            if (typeof this.onopen === 'function') {
              try { this.onopen(ev); } catch (_) {}
            }
            this.dispatchEvent(ev);
          });
        }

        send() {}
        close() { this.readyState = 3; }
      }

      function PatchedWebSocket(url, protocols) {
        const urlStr = String(url || '');
        const isViteHmr =
          urlStr.includes('vite') ||
          urlStr.includes('token=') ||
          urlStr.includes('24678') ||
          protocols === 'vite-hmr' ||
          (Array.isArray(protocols) && protocols.includes('vite-hmr'));

        if (isViteHmr) {
          return new ViteMockWebSocket(url, protocols);
        }
        return new NativeWebSocket(url, protocols);
      }

      PatchedWebSocket.CONNECTING = 0;
      PatchedWebSocket.OPEN = 1;
      PatchedWebSocket.CLOSING = 2;
      PatchedWebSocket.CLOSED = 3;
      PatchedWebSocket.prototype = NativeWebSocket.prototype;

      window.WebSocket = PatchedWebSocket;
    })();
  `;

  return {
    name: 'suppress-hmr-errors',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          children: scriptContent,
          injectTo: 'head-prepend' as const,
        },
      ];
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [suppressHmrErrorsPlugin(), react(), tailwindcss()],
    assetsInclude: ['**/*.glb'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
