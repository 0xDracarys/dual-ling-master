/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude docs and other non-production files from build
  webpack: (config, { isServer }) => {
    // Ignore docs folder (development-only documentation)
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.md$/,
      use: 'ignore-loader',
    });

    // Fix: Exclude server-only Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
      };
    }

    return config;
  },

  experimental: {},
}

export default nextConfig
