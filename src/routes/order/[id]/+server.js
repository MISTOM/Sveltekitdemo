import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { deleteOrder } from './utill';

const prisma = new PrismaClient();
/** @type {import('./$types').RequestHandler}*/
export async function GET({ params }) {
	const { id } = params;
	try {
		const result = await prisma.orders.findUnique({
			where: {
				id: parseInt(id)
			}
		});
		if (!result) return json({ message: 'Order not found' }, { status: 404 });
		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Mark order  is delivered
export async function PUT({ params, request }) {
	const { id } = params;
	const { isDelivered } = await request.json();
	try {
		const order = await prisma.orders.findUnique({
			where: {
				id: parseInt(id)
			}
		});
		if (!order) return json({ message: 'Order to mark idDelivered not found' }, { status: 404 });

		const result = await prisma.orders.update({
			where: {
				id: parseInt(id)
			},
			data: {
				isDelivered: isDelivered
			}
		});
		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Delete order
export async function DELETE({ params }) {
	const id = parseInt(params.id);

	const product = await prisma.orders.findUnique({
		where: {
			id
		}
	});
	if (!product) return json({ message: 'Product not found' }, { status: 404 });

	try {
		const order = await deleteOrder(id);
		return json(order, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
