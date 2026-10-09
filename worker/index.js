// Cloudflare Worker for the static site. Pages, images and other files are
// served straight from ./dist (see "assets" in wrangler.jsonc); this script
// adds a scheduled rebuild so new quotes in Airtable appear on the site.
export default {
  // only reached for URLs that don't match a built file; hand them back to
  // the asset server so the 404 page and trailing-slash redirects still apply
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },

  // runs on the cron schedule in wrangler.jsonc and triggers a fresh build
  async scheduled(controller, env) {
    if (!env.DEPLOY_HOOK_URL) {
      console.error('DEPLOY_HOOK_URL secret is not set, skipping rebuild');
      return;
    }
    const response = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Deploy hook failed: ${response.status} ${await response.text()}`);
    }
    console.log(`Rebuild triggered by cron "${controller.cron}"`);
  },
};
