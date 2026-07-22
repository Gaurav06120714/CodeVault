import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone admin console. Runs on its own port (3100); reads the shared cv_access cookie
  // (cookies are host-scoped, so a session on localhost:3000 is visible here on localhost).

  // Lean production image for Docker/Fly (bundles a minimal Node server). See docs/DEPLOY.md.
  // Required: the Dockerfile copies `.next/standalone`; without this, `next build`
  // never produces that folder and the Docker COPY fails.
  output: "standalone",
};

export default nextConfig;
