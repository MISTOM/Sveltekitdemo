import { error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

/**
 *
 * @param {{id: number, quantity: number}[]} products
 * @param {String} buyerName
 * @param {String} buyerEmail
 * @param {String} buyerPhone
 * @returns {Promise<import('@prisma/client').Orders>} Returns a Promise of the order created
 */
export const createOrder = async (products, buyerName, buyerEmail, buyerPhone) => {
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
	const result = await prisma.$transaction(async (prisma) => {
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

//TODO 📌📌
// /**
//  * Validate the input data for creating an order.
//  * @param {{id: number, quantity: number}[]} products
//  * @param {String} buyerName
//  * @param {String} buyerEmail
//  * @param {String} buyerPhone
//  * @returns {boolean} Returns true if the input data is valid, false otherwise.
//  */
// const validateOrderInput = (products, buyerName, buyerEmail, buyerPhone) => {
//     // Add your validation logic here...
//     return true;
// };

// /**
//  * Calculate the total price of the order.
//  * @param {{id: number, quantity: number}[]} products
//  * @param {{id: number, quantity: number, price: number}[]} dbProducts
//  * @returns {number} Returns the total price of the order.
//  */
// const calculateTotalPrice = (products, dbProducts) => {
//     let calculatedTotalPrice = 0;

//     for (const orderProduct of products) {
//         const productOnOrder = dbProducts.find((dbProduct) => dbProduct.id === orderProduct.id);
//         if (!productOnOrder) throw new Error(`Product ${orderProduct.id} not found`);
//         if (productOnOrder.quantity < orderProduct.quantity)
//             throw new Error(`Not enough quantity of product ${(productOnOrder.id, productOnOrder.name)} available`);

//         calculatedTotalPrice += productOnOrder.price * orderProduct.quantity;
//     }

//     return calculatedTotalPrice;
// };

// /**
//  * Create an order.
//  * @param {{id: number, quantity: number}[]} products
//  * @param {String} buyerName
//  * @param {String} buyerEmail
//  * @param {String} buyerPhone
//  * @returns {Promise<import('@prisma/client').Orders>} Returns a Promise of the order created
//  */
// export const createOrder = async (products, buyerName, buyerEmail, buyerPhone) => {
//     if (!validateOrderInput(products, buyerName, buyerEmail, buyerPhone)) {
//         throw new Error('Invalid input data');
//     }

//     const productIds = products.map((_product) => _product.id);
//     const dbProducts = await prisma.product.findMany({
//         where: {
//             id: {
//                 in: productIds
//             }
//         },
//         select: { id: true, quantity: true, price: true } // Fetch only the necessary fields
//     });

//     const totalPrice = calculateTotalPrice(products, dbProducts);

//     // Create the order in the database...
// };
