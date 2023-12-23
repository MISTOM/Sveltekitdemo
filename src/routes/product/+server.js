import { error, json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all products
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	//it theres a user in session get the user id and get their products only
	console.log('User', locals.user);

	if (locals.user) {
		try {
			const result = await prisma.product.findMany({
				where: {
					sellerId: locals.user.id
				}
			});

			return json(result, { status: 200 });
		} catch (e) {
			console.log(e);
			return json(e, { status: 500 });
		}
	}

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

//Create product
export async function POST({ request, locals: { user } }) {
	//check if user is logged in
	if (!user) return error(401, 'Unauthorized: You must be logged in to create a product');
	//check if user is a seller
	if (user.role !== 4) return error(401, 'Unauthorized: You must be a seller to create a product');

	const { name, description, price, images } = await request.json();
	if (!name || !price || !images) return error(400, 'Missing required fields');

	try {
		const result = await prisma.product.create({
			data: {
				name: name,
				description: description,
				price: price,
				images: JSON.stringify(images),
				sellerId: user.id,
				isApproved: false
			}
		});
		return json(result, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
