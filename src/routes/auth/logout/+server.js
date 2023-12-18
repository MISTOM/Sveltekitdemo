import { json, error } from '@sveltejs/kit';
//logout the user

/** @type {import('./$types').RequestHandler} */
export async function GET({locals}) {
    // const { supabase } = locals;
    // const session = await locals.getSession();
    // if (session) {
    //     const {error: err} = await supabase.auth.signOut();
    //     if (err) throw error(500, 'Something went wrong')
    // }
return json({}, {status: 201})
};