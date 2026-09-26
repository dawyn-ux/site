import type { APIRoute } from 'astro';
import { OAUTH_GITHUB_CLIENT_ID } from 'astro:env/server';

export const prerender = false;

const ALLOWED_SCOPES = new Set(['repo', 'public_repo', 'repo,user', 'public_repo,user']);

/**
 * Étape 1 de la connexion à l'administration : redirige vers GitHub.
 * Decap CMS ouvre cette adresse dans une fenêtre surgissante.
 */
export const GET: APIRoute = ({ url, cookies, redirect }) => {
  if (!OAUTH_GITHUB_CLIENT_ID) {
    return new Response(
      "Connexion GitHub non configurée : définissez OAUTH_GITHUB_CLIENT_ID et OAUTH_GITHUB_CLIENT_SECRET dans les variables d'environnement Vercel (voir README).",
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const requested = url.searchParams.get('scope') ?? 'repo';
  const scope = ALLOWED_SCOPES.has(requested) ? requested : 'repo';
  const state = crypto.randomUUID();

  cookies.set('cms_oauth_state', state, {
    path: '/api',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
  });

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', OAUTH_GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', new URL('/api/callback', url.origin).href);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('allow_signup', 'false');

  return redirect(authorize.href, 302);
};
