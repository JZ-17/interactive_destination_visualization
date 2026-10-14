// Prototypes are client-rendered: every view loads the CSV in the browser.
export const ssr = false;
export const prerender = true;

// Emit each route as <route>/index.html so the relative nav links between the
// two prototypes resolve the same way locally and when hosted.
export const trailingSlash = 'always';
