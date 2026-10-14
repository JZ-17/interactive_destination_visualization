import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // Static output so the prototypes can be hosted as plain files.
    adapter: adapter({ fallback: null }),
    paths: { relative: true }
  }
};

export default config;
