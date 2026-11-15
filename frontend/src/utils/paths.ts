// Addresses of the site's own files (data and images). The site may be served from a sub-folder (GitHub Pages: /EcoTwin/),
// so every such address goes through asset(); the base comes from the build (vite.config.ts, VITE_BASE) and is '/' locally.
export const asset = (path: string): string => import.meta.env.BASE_URL + path.replace(/^\//, '');

// Where the hourly live files are read from. Default: the site's own data/live folder (as when the live script publishes into it).
// For the hosted site, set VITE_LIVE_BASE at build time to the address of the folder that holds live_meta.json, live_frame.json, ...
export const LIVE_BASE: string = (import.meta.env.VITE_LIVE_BASE as string | undefined)?.replace(/\/$/, '') || asset('/data/live');
