// refresh token route

import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	return json({ message: 'Not implemented yet' }, { status: 501 });
}
