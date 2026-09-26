import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { settings } from '../../lib/content';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://www.connect-systemes.fr');
  const posts = (await getCollection('actualites', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  const items = posts
    .map((p) => {
      const url = new URL(`/actualites/${p.id}/`, base).href;
      return `<item><title>${escape(p.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${escape(p.data.summary)}</description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escape(settings.site_name)} — Actualités</title><link>${new URL('/actualites/', base).href}</link><description>${escape(settings.description)}</description><language>fr-fr</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
