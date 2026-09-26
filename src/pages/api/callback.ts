import type { APIRoute } from 'astro';
import { OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET } from 'astro:env/server';

export const prerender = false;

/** Page renvoyée à la fenêtre surgissante : transmet le jeton à Decap CMS (même origine uniquement). */
function respond(origin: string, status: 'success' | 'error', content: Record<string, string>) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const safe = (v: string) => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Connexion…</title></head>
<body style="font-family:system-ui,sans-serif;padding:2rem;color:#1a1715;background:#f6f4f0">
<p>${status === 'success' ? 'Connexion réussie, vous pouvez fermer cette fenêtre.' : 'La connexion a échoué. Fermez cette fenêtre et réessayez.'}</p>
<script>
(function () {
  var origin = ${safe(origin)};
  var message = ${safe(message)};
  if (!window.opener) return;
  function receive(e) {
    if (e.origin !== origin) return;
    window.removeEventListener('message', receive, false);
    window.opener.postMessage(message, origin);
    setTimeout(function () { window.close(); }, 250);
  }
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', origin);
})();
</script>
</body></html>`;
  return new Response(html, {
    status: status === 'success' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Étape 2 : GitHub renvoie ici avec un code, échangé contre un jeton d'accès. */
export const GET: APIRoute = async ({ url, cookies }) => {
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = cookies.get('cms_oauth_state')?.value;
  cookies.delete('cms_oauth_state', { path: '/api' });

  if (!OAUTH_GITHUB_CLIENT_ID || !OAUTH_GITHUB_CLIENT_SECRET) {
    return respond(origin, 'error', { error: 'Connexion GitHub non configurée sur le serveur.' });
  }
  if (!code || !state || !expected || state !== expected) {
    return respond(origin, 'error', { error: 'Requête de connexion invalide ou expirée.' });
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: OAUTH_GITHUB_CLIENT_ID,
        client_secret: OAUTH_GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: new URL('/api/callback', origin).href,
      }),
    });
    const data = (await res.json()) as { access_token?: string; error_description?: string };
    if (!res.ok || !data.access_token) {
      return respond(origin, 'error', { error: data.error_description ?? 'GitHub a refusé la connexion.' });
    }
    return respond(origin, 'success', { token: data.access_token, provider: 'github' });
  } catch {
    return respond(origin, 'error', { error: 'Impossible de joindre GitHub.' });
  }
};
