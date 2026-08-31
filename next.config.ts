import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  logging: {
    // Next 16 logs Server Function arguments in development by default.
    // Auth codes, e-mail addresses and profile form data must not enter terminal logs.
    serverFunctions: false,
    incomingRequests: { ignore: [/^\/auth\//, /^\/entrar(?:\?|$)/] },
    browserToTerminal: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
