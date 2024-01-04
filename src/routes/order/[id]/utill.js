import { error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

/**
 *
 * @param {{id: number, quantity: number}[]} products
 * @param {String} buyerName
 * @param {String} buyerEmail
 * @param {String} buyerPhone
 * @param {Number} totalPrice
 * @returns {Promise<import('@prisma/client').Orders>} Returns a Promise of the order created
 */
export const createOrder = async (products, buyerName, buyerEmail, buyerPhone, totalPrice) => {
	// Validate input data...

	try {
		const productIds = products.map((_product) => _product.id);
		const dbProducts = await prisma.product.findMany({
			where: {
				id: {
					in: productIds
				}
			},
			select: { id: true, quantity: true, name: true, sellerId: true, price: true }
		});
		let calculatedTotalPrice = 0;

		// Check Quantity 
		for (const orderProduct of products) {
			const productOnOrder = dbProducts.find((dbProduct) => dbProduct.id === orderProduct.id);
			if (!productOnOrder) return error(404, `Product ${orderProduct.id} not found`);
			if (productOnOrder.quantity < orderProduct.quantity)
				throw error(
					400,
					`Not enough quantity of product ${(productOnOrder.id, productOnOrder.name)} available`
				);
				calculatedTotalPrice += productOnOrder.price * orderProduct.quantity; // Calculate total price

		}

		// Process Payment
		//if Success...

		return await prisma.$transaction(async (prisma) => {
			//Update Quantities
			for (const orderProduct of products) {
				await prisma.product.update({
					where: { id: orderProduct.id },
					data: { quantity: { decrement: orderProduct.quantity } }
				});
			}

			//Save order
			const order = await prisma.orders.create({
				data: {
					buyerName,
					buyerEmail,
					buyerPhone,
					totalPrice: calculatedTotalPrice,
					isDelivered: false
				}
			});
			// Create the productOnOrderData
			const productOnOrderData = products.map((product) => {
				// Find the corresponding product from the database
				const matchedProduct = dbProducts.find((dbProduct) => dbProduct.id === product.id);
				if (!matchedProduct) throw error(404, `Product with the id: ${product.id} was not found`);

				return {
					orderId: order.id,
					productId: product.id,
					quantity: product.quantity,
					sellerId: matchedProduct.sellerId //seller ID from the database
				};
			});

			await prisma.productOnOrder.createMany({
				data: productOnOrderData
			});

			return order;
		});
	} catch (e) {
		// @ts-ignore
		return error(e.status, e.body.message);
	}
};

//delete an order
/** Delete an order
 * @param {Number} id Order Id
 */
export const deleteOrder = async (id) => {
	// @ts-ignore
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
