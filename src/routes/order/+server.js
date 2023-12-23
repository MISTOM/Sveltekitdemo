import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { createOrder } from './[id]/utill';

// Get all orders with isDelivered = true/false
const prisma = new PrismaClient();
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const isDelivered = url.searchParams.get('isDelivered');

	if (isDelivered === 'true') {
		try {
			const result = await prisma.orders.findMany({
				where: {
					isDelivered: true
				}
			});
			return json(result, { status: 200 });
		} catch (e) {
			console.log(e);
			return json(e, { status: 500 });
		}
	} else if (isDelivered === 'false') {
		try {
			const result = await prisma.orders.findMany({
				where: {
					isDelivered: false
				}
			});
			return json(result, { status: 200 });
		} catch (e) {
			console.log(e);
			return json(e, { status: 500 });
		}
	} else {
		try {
			const result = await prisma.orders.findMany();
			return json(result, { status: 200 });
		} catch (e) {
			console.log(e);
			return json(e, { status: 500 });
		}
	}
}

// Create order
export async function POST({ request }) {
	const { buyerName, buyerEmail, buyerPhone, totalPrice, products } = await request.json();
	//Assuming each product is associated with one seller, fetch the sellerId from the first product in the order.

	const sellerId = 2;

	try {
		const order = await createOrder(
			sellerId,
			products,
			buyerName,
			buyerEmail,
			buyerPhone,
			totalPrice
		);
		return json(order, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
