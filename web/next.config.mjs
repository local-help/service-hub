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

  // If hostname ends with onrender.com, use https://
  if (envUrl.includes('.onrender.com')) {
    return `https://${envUrl.replace(/\/+$/, '')}`;
  }

  // For Render private internal hostnames (e.g. localhelp-backend-sgbc)
  const port = envUrl.includes(':') ? '' : ':10000';
  return `http://${envUrl.replace(/\/+$/, '')}${port}`;
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
