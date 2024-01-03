import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

// Get all products
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { user } }) {
	const roles = await prisma.role.findMany();
	const role = roles.map((role) => role.id);

	let whereClause
	if (user){
		whereClause = user.role === role[0] ? {} : { sellerId: user.id };
	} else{
		whereClause = { isApproved: true };
	}

	try {
		const result = await prisma.product.findMany({
			where: whereClause
		})

		return json(result, { status: 200 });
	} catch (error) {
		return json(error, { status: 500 });
	}
}

//Create product
export async function POST({ request, locals: { user, data } }) {
	//check if user is logged in
	if (!user) return error(401, 'Unauthorized: You must be logged in to create a product');
	//check if user is a seller
	const roles = await prisma.role.findMany();
	const role = roles.map((role) => role.id);

	if (user.role !== role[1])
		return error(401, 'Unauthorized: You must be a seller to create a product');

	const name = data?.get('name')?.toString();
	const description = data?.get('description')?.toString();
	const price = data?.get('price')?.toString();
	const images = data?.get('images')?.toString();


	// const { name, description, price, images } = await request.json();
	if (!name || !price || !images) return error(400, 'Missing required fields');

	try {
		const result = await prisma.product.create({
			data: {
				name: name,
				description: description,
				price: Number(price),
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
