// BIPA Ventas sin conexión: guarda solo los archivos de la app (pantallas, estilos, íconos), nunca los datos de
// clientes. Siempre intenta la red primero, así la app se actualiza sola; sin red usa la última copia.
const CACHE = "bipa-ventas-v1";
const BASE = new URL("./", self.location).pathname;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./manifest.webmanifest", "./icono-192.png", "./marca.png", "./logo.svg"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  // Datos, sesión y todo lo que no es de la app pasan directo a la red.
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  event.respondWith(
    fetch(event.request)
      .then(r => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(event.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }).then(r => r || (event.request.mode === "navigate" ? caches.match("./") : Response.error()))),
  );
});
