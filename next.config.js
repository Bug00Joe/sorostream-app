/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained server.js in .next/standalone.
  // Required for the Docker deployment described in docs/DEPLOYMENT.md.
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep sodium-native out of the server bundle — it's a native addon
      // that Next.js doesn't need to bundle; Node can resolve it at runtime.
      config.externals = [...(Array.isArray(config.externals) ? config.externals : [config.externals ?? {}]), "sodium-native"];
    } else {
      // In the browser, replace sodium-native with an empty shim — the SDK
      // falls back to a pure-JS implementation for Ed25519 signing.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "sodium-native": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
