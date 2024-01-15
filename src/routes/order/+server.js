import { json, error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import MailService from '$lib/server/MailService';
import { createOrder } from './[id]/util';

// Get all orders with isDelivered = true/false

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
	const isDeliveredParam = url.searchParams.get('isDelivered');
	const isDelivered = isDeliveredParam === 'true'

	// Add pagination
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const orderBy = url.searchParams.get('orderBy') === 'asc' ? 'asc' : 'desc';

	const page = pageParam ? parseInt(pageParam) : 1;
	const limit = limitParam ? parseInt(limitParam) : 10 ;
	const skip = (page - 1) * limit;

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
		}

		return json(res, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Create order
export async function POST({ request }) {
	const { buyerName, buyerEmail, buyerPhone, products } = await request.json();

	try {
		const order = await createOrder(products, buyerName, buyerEmail, buyerPhone);

		//send email to the buyer displaying the order details: order id, total price, products ordered
		// const mail = {
		// 	to: buyerEmail,
		// 	subject: 'Order details',
		// 	text: `Your order was created successfully. Your order id is ${order.id}. Total price is ${order.totalPrice}`,
		// 	html: `<h3>Your order was created successfully</h3><br><p>Your order id is ${order.id}. Total price is ${order.totalPrice}</p><br>`
		// };
		// await MailService.sendMail(mail);

		return json(order, { status: 200 });
	} catch (e) {
		console.log(e);
		//@ts-ignore
		if (e.status !== 500) return error(e.status, e.body);
		console.log(e);
		return error(500, 'Internal server error');
	}
}
