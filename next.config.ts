import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // TEMPORARY: coming-soon noindex. REMOVE this metadata robots block and the
        // X-Robots-Tag header in next.config before launching real homepage content.
        source: "/",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
