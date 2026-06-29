/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Disable the App Router client-side cache for dynamic segments.
    // Without this, `<Link>` navigation in the same tab reuses the cached RSC
    // payload and our server components (including writeAuditLog) never re-run.
    // For an audit/POC app we want every navigation to produce a fresh log.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

module.exports = nextConfig;
