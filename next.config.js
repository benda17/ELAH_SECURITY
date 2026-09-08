/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "resend"],
  },
  async redirects() {
    return [
      { source: "/banking", destination: "/banking/dashboard", permanent: false },
      { source: "/founder", destination: "/founder/overview", permanent: false },
      { source: "/intent-matrix", destination: "/banking/intent-matrix", permanent: false },
      { source: "/training-dataset", destination: "/banking/training-dataset", permanent: false },
      { source: "/elah-model-roadmap", destination: "/founder/model-roadmap", permanent: false },
      { source: "/elah-roadmap", destination: "/founder/overview", permanent: false },
      {
        source: "/elah-roadmap/:path*",
        destination: "/founder/roadmap/:path*",
        permanent: false,
      },
      {
        source: "/api/roadmap/:path*",
        destination: "/api/founder/roadmap/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
