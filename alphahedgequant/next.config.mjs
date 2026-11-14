/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=31536000" },
      { key: "Permissions-Policy", value: "geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      // Only our own website can embed the standalone tournament board.
      { source: "/tournaments.html", headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" }
      ] },
    ];
  },
};
export default nextConfig;
