import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Gera uma pasta pronta para rodar no Docker, só com o necessário.
  output: 'standalone',
  // Modelo novo do Next.js: a página chega na hora com um "esqueleto" e os
  // dados da loja entram em seguida (streaming).
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
