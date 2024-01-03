import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { createOrder } from './[id]/utill';

// Get all orders with isDelivered = true/false

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
	const isDeliveredParam = url.searchParams.get('isDelivered');
	const isDelivered = isDeliveredParam == 'true' ? true : false;

	const roles = await prisma.role.findMany();
	const roleId = roles.map((role) => role.id);

	let whereClause = {};

	if (locals?.user?.role === roleId[0]) {
		// If user is an admin, get all orders
		whereClause = isDeliveredParam !== null ? { order: { isDelivered } } : {};
	} else if (locals?.user?.role === roleId[1]) {
		// If user is a seller, get only his orders
		whereClause =
			isDeliveredParam !== null
				? { sellerId: locals.user.id, order: { isDelivered } }
				: { sellerId: locals.user.id };
	} else {
		return error(401, 'Unauthorized');
	}

	try {
		const result = await prisma.productOnOrder.findMany({
			where: whereClause,
			include: {
				order: true,
				product: true
			}
		});
		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Create order
export async function POST({ request }) {
	const { buyerName, buyerEmail, buyerPhone, totalPrice, products } = await request.json();

	try {
		const order = await createOrder(products, buyerName, buyerEmail, buyerPhone, totalPrice);
		return json(order, { status: 200 });
	} catch (e) {
		// @ts-ignore
		return error(e.status, e.body.message);
	}
}
