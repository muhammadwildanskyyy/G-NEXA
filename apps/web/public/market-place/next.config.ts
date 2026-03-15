import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    async rewrites() {
        return [
            {
                source: "/api/media-service/:path*",
                destination: "http://localhost:8083/api/v1/:path*",
            },
        ];
    },
};

export default nextConfig;
