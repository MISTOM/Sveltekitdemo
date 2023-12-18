
import { json } from '@sveltejs/kit'
// Sign up user

/** @type {import('./$types').RequestHandler} */
export async function POST({locals, request}) {
    const {supabase} = locals
    const {email, password} = await request.json()
    const {data, error} = await supabase.auth.signUp({email, password})
    if (error) {
        return json(error, {status: error.status })
    }
    return json(data, {status: 201})
};