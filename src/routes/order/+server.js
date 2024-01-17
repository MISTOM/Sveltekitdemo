import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import MailService from '$lib/server/MailService';
import { createOrder } from './[id]/util';

/** @type {import('@prisma/client').Role[]} */
let roleCache;
async function getRoles() {
	if (!roleCache) {
		console.log('Querying db for roles');
		roleCache = await prisma.role.findMany();
	}
	return roleCache;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
	const isDeliveredParam = url.searchParams.get('isDelivered');
	const isDelivered = isDeliveredParam === 'true';

	// Add pagination
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const orderBy = url.searchParams.get('orderBy') === 'asc' ? 'asc' : 'desc';

	const page = pageParam ? parseInt(pageParam) : 1;
	const limit = limitParam ? parseInt(limitParam) : 10;
	const skip = (page - 1) * limit;

	const roles = await getRoles();

	let whereClause = {};

	if (locals?.user?.role === roles[0].id) {
		// If user is an admin, get all orders
		whereClause = isDeliveredParam !== null ? { order: { isDelivered } } : {};
	} else if (locals?.user?.role === roles[1].id) {
		// If user is a seller, get only his orders
		whereClause =
			isDeliveredParam !== null
				? { sellerId: locals.user.id, order: { isDelivered } }
				: { sellerId: locals.user.id };
	} else {
		return error(401, 'Unauthorized');
	}

	try {
		const [result, orderCount] = await Promise.all([
			prisma.productOnOrder.findMany({
				where: whereClause,
				skip,
				take: limit,
				orderBy: { createdAt: orderBy },
				include: {
					order: true,
					product: true
				}
			}),
			prisma.productOnOrder.count({
				where: whereClause
			})
		]);

		/** Type Definition of the Product
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

		/**Type Definition of the Order
		 * @typedef {Object} Order
		 * @property {number} orderId
		 * @property {string} buyerName
		 * @property {string} buyerEmail
		 * @property {string} buyerPhone
		 * @property {String} location
		 * @property {number} totalPrice
		 * @property {boolean} isDelivered
		 * @property {Product[]} products
		 */

		/** @type {Order[]} */
		const grouped = result.reduce((acc, cur) => {
			// @ts-ignore
			const existingOrder = acc.find((order) => order.orderId === cur.orderId);
			if (existingOrder) {
				// @ts-ignore
				existingOrder.products.push({ ...cur.product, orderedQuantity: cur.quantity });
			} else {
				// @ts-ignore
				acc.push({
					orderId: cur.orderId,
					buyerName: cur.order.buyerName,
					buyerEmail: cur.order.buyerEmail,
					buyerPhone: cur.order.buyerPhone,
					location: cur.order.location,
					totalPrice: cur.order.totalPrice,
					isDelivered: cur.order.isDelivered,
					products: [{ ...cur.product, orderedQuantity: cur.quantity }]
				});
			}
			return acc;
		}, []);

		const res = {
			orders: grouped,
			totalPages: Math.ceil(orderCount / limit),
			currentPage: page,
			totalOrders: orderCount
		};

		return json(res, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Create order
export async function POST({ request }) {
	const { buyerName, buyerEmail, buyerPhone, location, products } = await request.json();

	try {
		const order = await createOrder(products, buyerName, buyerEmail, buyerPhone, location);

		const result = await prisma.productOnOrder.findMany({
			where: {
				orderId: order.id
			},
			include: {
				order: true,
				product: {
					include: { images: true }
				}
			}
		});

		/** Type Definition of the Product
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

		/**Type Definition of the Order
		 * @typedef {Object} Order
		 * @property {number} orderId
		 * @property {string} buyerName
		 * @property {string} buyerEmail
		 * @property {string} buyerPhone
		 * @property {String} location
		 * @property {number} totalPrice
		 * @property {boolean} isDelivered
		 * @property {Product[]} products
		 */

		/** @type {Order[]} */
		const grouped = result.reduce((acc, cur) => {
			// @ts-ignore
			const existingOrder = acc.find((order) => order.orderId === cur.orderId);
			if (existingOrder) {
				// @ts-ignore
				existingOrder.products.push({ ...cur.product, orderedQuantity: cur.quantity });
			} else {
				// @ts-ignore
				acc.push({
					orderId: cur.orderId,
					buyerName: cur.order.buyerName,
					buyerEmail: cur.order.buyerEmail,
					buyerPhone: cur.order.buyerPhone,
					location: cur.order.location,
					totalPrice: cur.order.totalPrice,
					isDelivered: cur.order.isDelivered,
					products: [{ ...cur.product, orderedQuantity: cur.quantity }]
				});
			}
			return acc;
		}, []);
		// console.log('created order: ', grouped);

		await MailService.sendOrderEmail(buyerEmail, grouped[0]);

		return json(grouped, { status: 200 });
	} catch (e) {
		console.log(e);
		//@ts-ignore
		if (e.status !== 500) return error(e.status, e.body);
		console.log(e);
		return error(500, 'Internal server error');
	}
}
