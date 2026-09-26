import type { APIRoute } from 'astro';
import { buildCmsConfig } from '../../lib/cms-config';

// Dépôt GitHub édité par le CMS. Sur Vercel, il est détecté automatiquement
// (variables système VERCEL_GIT_*) ; sinon, définir CMS_GITHUB_REPO="organisation/depot".
const repo =
  process.env.CMS_GITHUB_REPO ||
  (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
    ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
    : 'dawyn-ux/site');
const branch = process.env.CMS_GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'main';

export const GET: APIRoute = ({ site }) => {
  const config = buildCmsConfig({ repo, branch, siteUrl: (site ?? new URL('https://www.connect-systemes.fr')).origin });
  // Le JSON est un sous-ensemble valide du YAML : Decap CMS le lit directement.
  return new Response(JSON.stringify(config, null, 2), {
    headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
  });
};
