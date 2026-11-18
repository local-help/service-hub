import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getBackendUrl = () => {
  const envUrl = process.env.BACKEND_URL;
  if (!envUrl) {
    return process.env.NODE_ENV === 'production' ? 'http://backend:3000' : 'http://localhost:3000';
  }

  // If already starts with http:// or https://, use as-is (strip trailing slashes)
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl.replace(/\/+$/, '');
  }

  // Local development hostnames
  if (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
    const port = envUrl.includes(':') ? '' : ':3000';
    return `http://${envUrl.replace(/^https?:\/\//, '')}${port}`;
  }

  // For Render deployments (Render free tier does not support private networking; must use public HTTPS)
  if (envUrl.includes('.onrender.com') || process.env.RENDER === 'true' || !envUrl.includes('.')) {
    const cleanHost = envUrl.replace(/^https?:\/\//, '').replace(/\.onrender\.com$/, '').replace(/:[0-9]+$/, '');
    return `https://${cleanHost}.onrender.com`;
  }

  return `http://${envUrl.replace(/\/+$/, '')}`;
};

const BACKEND_URL = getBackendUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
