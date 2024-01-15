import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { deleteOrder } from './util';

/** @type {import('@prisma/client').Role[]} */
let roleCache;
async function getRoles() {
	if (!roleCache) {
		console.log('Querying db for roles');
		roleCache = await prisma.role.findMany();
	}
	return roleCache;
}

/** @type {import('./$types').RequestHandler}*/
export async function GET({ params, locals }) {
	const roles = await getRoles();
	console.log('roles', roles);
	// If user is not an admin, throw error
	if (locals?.user?.role !== roles[0].id) throw error(401, 'Unauthorized');

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
		if (!result) throw error(404, 'Order not found');
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
		//@ts-ignore
		if (e.status !== 500) return error(e.status, e.message);
		console.log(e);
		return error(500, `Failed to get order ${e}`);
	}
}

// Mark order  is delivered
export async function PUT({ params, request, locals }) {
	const { id } = params;
	const { isDelivered } = await request.json();

	const roles = await getRoles();
	if (locals?.user?.role !== roles[0].id) throw error(401, 'Unauthorized');

	try {
		const order = await prisma.orders.findUnique({
			where: {
				id: parseInt(id)
			}
		});
		if (!order) throw error(404, 'Order not found');

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
		//@ts-ignore
		if (e.status !== 500) return error(e.status, e.message);
		console.log(e);
		return error(500, `Failed to update order ${e}`);
	}
}

// Delete order
export async function DELETE({ params, locals }) {
	const id = parseInt(params.id);
	if (isNaN(id)) throw error(400, 'Invalid order id');
	const roles = await getRoles();
	if (locals?.user?.role !== roles[0].id) throw error(401, 'Unauthorized');

	try {
		const order = await deleteOrder(id);
		return json(order, { status: 200 });
	} catch (e) {
		//@ts-ignore
		if (e.status !== 500) return error(e.status, e.body);
		console.log(e);
		return error(500, `Failed to delete order: ${e}`);
	}
}
