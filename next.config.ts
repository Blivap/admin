import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiUrl) return [];
    // Browser calls same-origin /admin/* so Set-Cookie lands on the admin host
    // (e.g. localhost:8057), not the Nest port. Middleware can then see admin_session.
    return [
      {
        source: "/admin/:path*",
        destination: `${apiUrl}/admin/:path*`,
      },
      // Page route `/hospitals` owns that path — proxy the Nest list via /api/hospitals.
      {
        source: "/api/hospitals",
        destination: `${apiUrl}/hospitals`,
      },
      {
        source: "/api/hospitals/:path*",
        destination: `${apiUrl}/hospitals/:path*`,
      },
    ];
  },
};

export default nextConfig;
