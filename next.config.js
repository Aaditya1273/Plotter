/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    webpackBuildWorker: true,
  },
  
  // Exclude backend folders from compilation
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Configure Turbopack (Next.js 16+ default) - removed invalid config
  // turbopack config moved to experimental section in Next.js 16+
  
  // Keep webpack config for fallback compatibility
  webpack: (config, { isServer, dev }) => {
    // Development optimizations
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/envio', '**/scripts', '**/cache', '**/artifacts'],
      }
    }

    // Exclude backend folders from webpack compilation
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [
        /node_modules/,
        /envio/,
        /scripts/,
        /cache/,
        /artifacts/,
        /test/,
      ],
    });

    // Handle MetaMask SDK React Native dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      // Let MetaMask SDK handle its own async storage
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
    
    // Optimize chunks for faster loading
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }
    
    return config;
  },
}

module.exports = nextConfig