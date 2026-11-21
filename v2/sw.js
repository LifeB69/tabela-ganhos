// A prévia saiu de /v2/. Este service worker se desliga e manda a página para o endereço principal.
// Os caches não são apagados aqui: o app principal usa o mesmo nome de cache e limpa os antigos sozinho.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate('../');
  })());
});
