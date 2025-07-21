import type { NextConfig } from "next";
// Add bundle analyzer import
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
};

// Export with bundle analyzer
module.exports = withBundleAnalyzer(nextConfig);
