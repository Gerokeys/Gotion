import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @libsql/client ships non-JS files (LICENSE, etc.) alongside its module
  // that Turbopack chokes on if it tries to bundle them. It's a server-only
  // dependency (the Prisma driver adapter), so keep it external instead.
  serverExternalPackages: [
    "@libsql/client",
    "@libsql/core",
    "@libsql/hrana-client",
    "@libsql/isomorphic-ws",
    "@prisma/adapter-libsql",
  ],
};

export default nextConfig;
