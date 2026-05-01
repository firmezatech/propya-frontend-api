import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
   localePrefix: 'as-needed',
   locales: ['en', 'pt'],
   defaultLocale: 'en'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ORACLE_API: process.env.NEXT_PUBLIC_ORACLE_API,
    NEXT_PUBLIC_FIRMEZA_API_URL: process.env.NEXT_PUBLIC_FIRMEZA_API_URL,
    NEXT_PUBLIC_FMZ_API_TIMEOUT_MS: process.env.NEXT_PUBLIC_FMZ_API_TIMEOUT_MS,
    NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY: process.env.NEXT_PUBLIC_FMZ_AUTH_TOKEN_STORAGE_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
