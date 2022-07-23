const path = require("path");
/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: { images: { allowFutureImage: true } },
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },
  images: {
    domains: [
      "res.cloudinary.com",
      "testimonialapi.toolcarton.com",
      "cdn-images-1.medium.com",
    ],
  },
};

module.exports = nextConfig;
