//get orders by email
import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { email } = await request.json();
    if (!email) return error(400, 'Email is required');

	try {
		const orders = await prisma.orders.findMany({
			where: { buyerEmail: email },
			include: {
				products: {
					include: {
						product: true,
						seller: true
					}
				}
			}
		});
        console.log(orders)

        if (!orders) return error(404, 'Order not found');

		const result = orders.map((order) => ({
			orderId: order.id,
			buyerName: order.buyerName,
			buyerEmail: order.buyerEmail,
			buyerPhone: order.buyerPhone,
			totalPrice: order.totalPrice,
			isDelivered: order.isDelivered,
			products: order.products.map((productOnOrder) => ({
				id: productOnOrder.product.id,
				name: productOnOrder.product.name,
				description: productOnOrder.product.description,
				price: productOnOrder.product.price,
				quantity: productOnOrder.product.quantity,
				sellerId: productOnOrder.seller.id,
				isApproved: productOnOrder.product.isApproved,
				createdAt: productOnOrder.product.createdAt,
				updatedAt: productOnOrder.product.updatedAt,
				orderedQuantity: productOnOrder.quantity
			}))
		}));

		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return error(500, `Failed to get orders ${e}`);
	}
}
