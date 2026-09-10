import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// The Cloudflare development bridge starts Miniflare and reads wrangler.jsonc.
// It must not run during `next build`: production uses the generated OpenNext
// worker instead, and starting the local bridge there can leave Workers Builds
// waiting until its timeout.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    "erp.rkngroup.my.id",
  ],

  /*
   * RKN_CLOUDFLARE_PRIVATE_TRACE_CONTAINMENT_V1
   *
   * data/private contains local backups, recovery material,
   * checkpoints, freeze artifacts, and runtime logs.
   *
   * F4G proved there are no application runtime references
   * to data/private, so these files must never enter a
   * standalone / Cloudflare deployment bundle.
   *
   * IMPORTANT:
   * Do NOT exclude data/rkn-erp.sqlite here.
   * The current Node runtime still genuinely depends on it
   * until Cloudflare database migration is complete.
   */
  outputFileTracingExcludes: {
    "/*": [
      "./data/private/**/*",
    ],
  },
};

export default nextConfig;
