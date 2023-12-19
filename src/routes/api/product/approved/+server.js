//get approved products
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	try {
		const result = await prisma.products.findMany({
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
