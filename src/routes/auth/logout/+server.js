import { json } from '@sveltejs/kit';

//logout the user
/** @type {import('./$types').RequestHandler} */
export async function GET() {
	return json({ message: 'Logout successful' }, { status: 200 });
}
