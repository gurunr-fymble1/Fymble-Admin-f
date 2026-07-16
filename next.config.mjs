/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fittbot-uploads.s3.ap-south-2.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
