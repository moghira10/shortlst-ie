// Served at shortlst.me/practice: asparagus (the main shortlst.me app)
// rewrites /practice/* to this deployment (Next.js multi-zones), so every
// route here lives under this base path.
const basePath = '/practice';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
};

module.exports = nextConfig;
