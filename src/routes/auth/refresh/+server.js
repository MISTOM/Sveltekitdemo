// refresh token route

import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({request}){
    // const token = request.headers.get('Authorization')?.split(' ')[1]; // Bearer <token>
    // if (!token) return error(400, 'Token is required');

    const data = await request.formData()
    return json({message: 'ok'})
    


}
