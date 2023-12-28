//get approved products
import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		const result = await prisma.product.findMany({
			where: {
				isApproved: true
			}
		});
		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
