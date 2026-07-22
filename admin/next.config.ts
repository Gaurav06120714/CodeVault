import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone admin console served under /admin so it's SAME-ORIGIN with the main app
  // (the frontend proxies /admin/* to this service). basePath prefixes every route,
  // API route, and asset with /admin so the shared cv_access cookie is sent to it.
  basePath: "/admin",

  // Lean production image for Docker/Fly (bundles a minimal Node server). See docs/DEPLOY.md.
  // Required: the Dockerfile copies `.next/standalone`; without this, `next build`
  // never produces that folder and the Docker COPY fails.
  output: "standalone",
};

export default nextConfig;
