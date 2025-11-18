import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode to prevent double API calls in development
  reactStrictMode: false,
  
  // distDir: 'outputStatic',
  // output: 'export',
  
  // // Configure image domains if using external images
  // images: {
  //   unoptimized: true, // For static export
  // },
  
  // // Add any other configuration options here
  // webpack: (config, { dev, isServer }) => {
  //   if (dev && !isServer) {
  //     config.watchOptions = {
  //       ignored: [resolve(__dirname, 'outputStatic')],
  //     };
  //   }
  //   return config;
  // }
};

export default nextConfig;
