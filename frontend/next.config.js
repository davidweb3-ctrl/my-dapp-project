/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      // Add browser-specific fallbacks
      'indexeddb': false,
      'idb-keyval': false,
      'idb': false,
    };
    config.externals.push('pino-pretty', 'encoding');
    
    // Ignore React Native specific modules that are not needed in web
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'idb-keyval': false,
      'idb': false,
    };
    
    // Ignore warnings for missing React Native modules and browser APIs
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@react-native-async-storage\/async-storage'/,
      /Critical dependency: the request of a dependency is an expression/,
      /indexedDB is not defined/,
      /ReferenceError: indexedDB is not defined/,
      /unhandledRejection: ReferenceError: indexedDB is not defined/,
    ];
    
    return config;
  },
};

module.exports = nextConfig;

