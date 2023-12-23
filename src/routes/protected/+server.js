import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	return json({ message: `Hello from protected ${JSON.stringify(locals.user)}` }, { status: 200 });
}
