/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: { domains: ['picsum.photos'] },
};
module.exports = nextConfig;
