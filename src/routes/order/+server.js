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

	// @ts-ignore
	if (locals?.user?.role === roleId[0]) {
		// If user is an admin, get all orders
		whereClause = isDeliveredParam !== null ? { order: { isDelivered } } : {};
	// @ts-ignore
	} else if (locals?.user?.role === roleId[1]) {
		// If user is a seller, get only his orders
		whereClause =
			isDeliveredParam !== null
				// @ts-ignore
				? { sellerId: locals.user.id, order: { isDelivered } }
				// @ts-ignore
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

		/** Type Defination of the Product
		 * @typedef {Object} Product
		 * @property {number} id
		 * @property {string} name
		 * @property {string|null} description
		 * @property {number} price
		 * @property {string} images
		 * @property {number} quantity
		 * @property {number} sellerId
		 * @property {boolean} isApproved
		 */

		/**Type Defination of the Order
		 * @typedef {Object} Order
		 * @property {number} orderId
		 * @property {string} buyerName
		 * @property {string} buyerEmail
		 * @property {string} buyerPhone
		 * @property {number} totalPrice
		 * @property {boolean} isDelivered
		 * @property {Product[]} products
		 */

		/** @type {Order[]} */
		const grouped = result.reduce((acc, cur) => {
			// @ts-ignore
			const existingOrder = acc.find(order => order.orderId === cur.orderId);
			if (existingOrder) {
				// @ts-ignore
				existingOrder.products.push({...cur.product, orderedQuantity: cur.quantity});
			} else {
				// @ts-ignore
				acc.push({
					orderId: cur.orderId,
					buyerName: cur.order.buyerName,
					buyerEmail: cur.order.buyerEmail,
					buyerPhone: cur.order.buyerPhone,
					totalPrice: cur.order.totalPrice,
					isDelivered: cur.order.isDelivered,
					products: [{...cur.product, orderedQuantity: cur.quantity}]
				});
			}
			return acc;
		}, []);



		return json(grouped, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Create order
// @ts-ignore
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
