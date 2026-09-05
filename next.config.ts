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
    // O Content-Security-Policy é montado por requisição em `proxy.ts`, porque
    // depende de um nonce. Aqui ficam apenas os cabeçalhos estáticos.
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    ];

    if (process.env.NODE_ENV === "production") {
      // HSTS só faz sentido sobre HTTPS e é ignorado pelo navegador em http.
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [{ source: "/:path*", headers }];
  },
};

export default nextConfig;
