import { json } from '@sveltejs/kit';
import {createConn} from '$lib/db/db'

/** @type {import('./$types').RequestHandler} */
export async function GET({locals, request, url}) {

	const db = await createConn()

	try{
		let result = await db.query('SELECT * FROM products').then( ([rows]) => {
			return rows
		})

		return json(result, {status: 200})

	} catch (e) {
		console.log(e)
		return json({error: e}, {status: 500})
	}
}
