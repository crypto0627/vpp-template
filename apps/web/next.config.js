/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Turborepo build optimization
  transpilePackages: ['@repo/eslint-config', '@repo/typescript-config'],
};

export default nextConfig;
