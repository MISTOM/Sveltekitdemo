import { json } from '@sveltejs/kit';
import { createConn } from '$lib/db/db';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all products
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const db = await createConn();

	//it theres a user in session get the user id and get theis products onlu
	//otherwise get all products

	try {
		// // @ts-ignore
		// let result = await db.query('SELECT * FROM products').then( ([rows]) => {
		// 	return rows
		// })
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

//Create product
export async function POST({ request }) {
	const { name, description, price, images } = await request.json();

	//random number for a seller ID for now. Get from the current session later
	const sellerId = Math.floor(Math.random() * 1000);

	try {
		const result = await prisma.products.create({
			data: {
				name: name,
				description: description,
				price: price,
				images: JSON.stringify(images),
				sellerId: sellerId,
				isApproved: false
			}
		});
		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
