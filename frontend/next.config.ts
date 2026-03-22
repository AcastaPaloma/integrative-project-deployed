import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      /* NiiVue uses WebGL workers that rely on dynamic chunk loading.
         Mark the canvas polyfill as external so webpack does not try
         to bundle or resolve it during SSR or client builds. */
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        canvas: false,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
