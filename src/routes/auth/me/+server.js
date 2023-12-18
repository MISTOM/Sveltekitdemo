import { json } from '@sveltejs/kit';

//get the current user session

/** @type {import('./$types').RequestHandler} */
// export async function GET({locals}) {
//     const {supabase} = locals;
//     const session = await locals.getSession();
//     return json(session? session : {});
// };