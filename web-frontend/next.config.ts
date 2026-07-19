import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the built-in Next.js dev badge (the black circle/triangle in the corner) so it
  // doesn't get mistaken for CodeVault branding. Only affects `npm run dev`.
  devIndicators: false,

  // Lean production image for Docker/Fly (bundles a minimal Node server).
  output: "standalone",

  // Same-origin proxy for deployment: the browser only ever talks to this frontend's origin,
  // so the session cookies + CSRF work with no cross-domain headaches. This is done with RUNTIME
  // route handlers (src/app/api/[...path] and src/app/gitapi/[...path]) — NOT next.config
  // rewrites, which resolve at BUILD time when BACKEND_URL/GIT_URL (fromService.hostport) don't
  // exist yet, so the proxy silently 404'd in prod. See src/utils/proxy.ts and docs/DEPLOY.md.
};

export default nextConfig;
