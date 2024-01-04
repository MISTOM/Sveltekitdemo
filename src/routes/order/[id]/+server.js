import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { deleteOrder } from './utill';

/** @type {import('./$types').RequestHandler}*/
export async function GET({ params }) {
	const { id } = params;
	try {
		const result = await prisma.orders.findUnique({
			where: {
				id: parseInt(id)
			},
			include: {
				products: {
					include: {
						product: true,
						seller: true
					}
				}
			}
		});
		if (!result) return json({ message: 'Order not found' }, { status: 404 });
		const grouped = {
			...result,
			products: result.products.map((productOnOrder) => ({
				...productOnOrder.product,
				sellerId: productOnOrder.seller.id,
				orderedQuantity: productOnOrder.quantity
			}))
		};

		return json(grouped, { status: 200 });
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
	if (!product) return error(404, 'Order to delete not found');

	try {
		const order = await deleteOrder(id);
		return json(order, { status: 200 });
	} catch (e) {
		console.log(e);
		//@ts-ignore
		return error(e.status, e.body.message);
	}
}
