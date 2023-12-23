import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
/**
 *
 * @param {Number} sellerId
 * @param {String} products
 * @param {String} buyerName
 * @param {String} buyerEmail
 * @param {String} buyerPhone
 * @param {Number} totalPrice
 * @returns
 */
export const createOrder = async (
	sellerId,
	products,
	buyerName,
	buyerEmail,
	buyerPhone,
	totalPrice
) => {
	const _products = JSON.parse(products);
	// Start a transaction
	const result = await prisma.$transaction(async (prisma) => {
		// Create the order
		const order = await prisma.orders.create({
			data: {
				sellerId: sellerId,
				buyerName: buyerName,
				buyerEmail: buyerEmail,
				buyerPhone: buyerPhone,
				totalPrice: totalPrice,
				isDelivered: false
			}
		});

		// For each product in the order, create an entry in the join table
		for (const product of _products) {
			await prisma.productOnOrder.create({
				data: {
					orderId: order.id,
					productId: product.id,
					quantity: product.quantity
				}
			});
		}

		return order;
	});
	return result;
};

//delete an order
/**
 * @param {Number} id Order Id
 */
export const deleteOrder = async (id) => {
	const result = prisma.$transaction(async (prisma) => {
		await prisma.productOnOrder.deleteMany({
			where: {
				orderId: id
			}
		});
		const order = await prisma.orders.delete({
			where: {
				id
			}
		});
		return order;
	});
};
