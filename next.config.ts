import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "19f86181fa27.ngrok-free.app",
    "https://19f86181fa27.ngrok-free.app",
    "pop-os.tail44b053.ts.net"
  ],
  async redirects() {
    return [
      // /inicio y /dashboard renderizaban el mismo panel del estudiante; se unifica en /dashboard.
      { source: "/inicio", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
