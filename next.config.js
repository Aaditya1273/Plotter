/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure Turbopack (Next.js 16+ default)
  turbopack: {
    resolveAlias: {
      '@react-native-async-storage/async-storage': './app/lib/async-storage-mock.js',
    },
  },
  
  // Keep webpack config for fallback compatibility
  webpack: (config, { isServer }) => {
    // Handle MetaMask SDK React Native dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': require.resolve('./app/lib/async-storage-mock.js'),
    };
    
    // Minimal fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Only externalize for server-side
    if (isServer) {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
    }
    
    // Suppress specific warnings
    config.ignoreWarnings = [
      /Module not found: Can't resolve 'pino-pretty'/,
      /Module not found: Can't resolve 'lokijs'/,
      /Module not found: Can't resolve 'encoding'/,
      /Critical dependency: the request of a dependency is an expression/,
    ];
    
    return config;
  },
}

module.exports = nextConfig