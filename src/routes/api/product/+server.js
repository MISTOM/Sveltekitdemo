import { json } from '@sveltejs/kit';
import {createConn} from '$lib/db/db'
import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

/** @type {import('./$types').RequestHandler} */
export async function GET({locals, request, url}) {

	const db = await createConn()

	try {
		// // @ts-ignore
		// let result = await db.query('SELECT * FROM products').then( ([rows]) => {
		// 	return rows
		// })
		const result = await prisma.products.findMany()
		

		return json(result, {status: 200})

	} catch (e) {
		console.log(e)
		return json(e, {status: 500})
	}
}
