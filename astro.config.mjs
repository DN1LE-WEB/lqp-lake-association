import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// Polyfill MessageChannel for Cloudflare Workers + React 19
const messageChannelPolyfill = {
  name: 'message-channel-polyfill',
  transform(code, id) {
    if (id.includes('react-dom') && code.includes('MessageChannel')) {
      return `
if (typeof globalThis.MessageChannel === 'undefined') {
  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = { onmessage: null, postMessage(d) { if(this._other.onmessage) this._other.onmessage({data:d}); }, close(){}, start(){}, addEventListener(){}, removeEventListener(){} };
      this.port2 = { onmessage: null, postMessage(d) { if(this._other.onmessage) this._other.onmessage({data:d}); }, close(){}, start(){}, addEventListener(){}, removeEventListener(){} };
      this.port1._other = this.port2;
      this.port2._other = this.port1;
    }
  };
}
${code}`;
    }
  },
};

// Fix Keystatic OAuth: add redirect_uri to token exchange (required by GitHub
// when redirect_uri was provided in the authorize step)
const keystatic_oauth_fix = {
  name: 'keystatic-oauth-fix',
  transform(code, id) {
    if (id.includes('keystatic-core-api-generic') && code.includes("url.searchParams.set('code', code)")) {
      return code.replaceAll(
        "url.searchParams.set('code', code);",
        "url.searchParams.set('code', code);\n  url.searchParams.set('redirect_uri', new URL(req.url).origin + '/api/keystatic/github/oauth/callback');"
      );
    }
  },
};

export default defineConfig({
  integrations: [
    react(),
    markdoc(),
    keystatic(),
    tailwind(),
  ],
  adapter: cloudflare(),
  vite: {
    plugins: [messageChannelPolyfill, keystatic_oauth_fix],
  },
});
