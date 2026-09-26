import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { settings, fullAddress } from '../lib/content';

// Résumé du site destiné aux assistants IA (convention llms.txt).
export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://www.connect-systemes.fr');
  const gammes = (await getCollection('gammes')).sort((a, b) => a.data.order - b.data.order);
  const lines = [
    `# ${settings.legal_name}`,
    '',
    `> ${settings.description}`,
    '',
    `Adresse : ${fullAddress()} — Téléphone : ${settings.contact.phone} — E-mail : ${settings.contact.email}`,
    '',
    '## Gammes',
    ...gammes.map((g) => `- [${g.data.title}](${new URL(`/gammes/${g.id}/`, base).href}) : ${g.data.summary}`),
    '',
    '## Pages',
    `- [Services](${new URL('/services/', base).href})`,
    `- [Documentation technique](${new URL('/documentation/', base).href})`,
    `- [L'entreprise](${new URL('/entreprise/', base).href})`,
    `- [Contact](${new URL('/contact/', base).href})`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
