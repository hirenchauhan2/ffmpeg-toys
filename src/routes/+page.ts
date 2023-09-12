import type { PageLoad } from './$types';

export const load = (async ({ setHeaders }) => {
	// these headers are required in order to enable SharedArrayBuffers in secure context
	// @link: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
	setHeaders({
		'Cross-Origin-Embedder-Policy': 'require-corp',
		'Cross-Origin-Opener-Policy': 'same-origin'
	});
}) satisfies PageLoad;
