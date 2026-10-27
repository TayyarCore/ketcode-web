import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/websites", destination: "/websites/index.html" },
        { source: "/websites/", destination: "/websites/index.html" },
        { source: "/templates", destination: "/templates/index.html" },
        { source: "/templates/", destination: "/templates/index.html" },
        { source: "/templates/realestate", destination: "/templates/realestate/index.html" },
        { source: "/templates/realestate/", destination: "/templates/realestate/index.html" },
        { source: "/templates/clinic", destination: "/templates/clinic/index.html" },
        { source: "/templates/clinic/", destination: "/templates/clinic/index.html" },
        { source: "/templates/salon", destination: "/templates/salon/index.html" },
        { source: "/templates/salon/", destination: "/templates/salon/index.html" },
        { source: "/terms", destination: "/terms/index.html" },
        { source: "/terms/", destination: "/terms/index.html" },
        { source: "/privacy", destination: "/privacy/index.html" },
        { source: "/privacy/", destination: "/privacy/index.html" },
        { source: "/refund", destination: "/refund/index.html" },
        { source: "/refund/", destination: "/refund/index.html" },
      ],
    };
  },
};

export default nextConfig;
