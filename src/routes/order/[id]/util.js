import { error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import MailService from '$lib/server/MailService';

/**
 * Creates an order.
 * @param {{id: number, quantity: number}[]} products
 * @param {String} buyerName
 * @param {String} buyerEmail
 * @param {String} buyerPhone
 * @returns {Promise<import('@prisma/client').Orders>} Returns a Promise of the order created
 */
export const createOrder = async (products, buyerName, buyerEmail, buyerPhone) => {
	// Validate input data...
	if (!buyerName) throw error(400, 'Buyer name is required');
	if (!buyerEmail) throw error(400, 'Buyer email is required');
	if (!buyerPhone) throw error(400, 'Buyer phone is required');
	if (!products || products?.length <= 0) throw error(400, 'Products are required');
	if (!products.every((product) => product.id && product.quantity))
		throw error(400, 'Each product must have an id an quantity');

	let productOnOrder;

	const productIds = products.map((_product) => _product.id);

	const dbProducts = await prisma.product.findMany({
		where: {
			id: {
				in: productIds
			}
		},
		select: { id: true, quantity: true, name: true, sellerId: true, price: true, images: true }
	});
	let calculatedTotalPrice = 0;

	// Check Quantity
	for (const orderProduct of products) {
		productOnOrder = dbProducts.find((dbProduct) => dbProduct.id === orderProduct.id);
		if (!productOnOrder)
			throw error(404, `The product wit the ID ${orderProduct.id} was not found`);
		if (productOnOrder.quantity < orderProduct.quantity)
			throw error(
				400,
				`The requested quantity for the product ${productOnOrder.name} is not available. Only ${productOnOrder.quantity} is available.`
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
			},
			include: { products: true }
		});
		// Create the productOnOrderData to save to db
		const productOnOrderData = products.map((product) => {
			// Find the corresponding product from the database
			const matchedProduct = dbProducts.find((dbProduct) => dbProduct.id === product.id);
			if (!matchedProduct) throw error(404, `The product with ID ${product.id} was not found`);

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

		//send mail to all the sellers
		// const sellerIds = productOnOrderData.map((product) => product.sellerId);
		// const sellersEmails = await prisma.user.findMany({
		// 	where: {
		// 		id: {
		// 			in: sellerIds
		// 		}
		// 	}, select:{email: true}
		// });

		// await MailService.sendOrderEmail(sellersEmails, buyerName, buyerEmail, buyerPhone, order.id);

		//send main to buyer
		console.log(productOnOrder);

		return order;
	});
};

//delete an order
/** Delete an order
 * @param {Number} id Order Id
 */
export const deleteOrder = async (id) => {
	const order = await prisma.orders.findUnique({
		where: {
			id
		}
	});
	if (!order) throw error(404, 'Order not found');

	const result = await prisma.$transaction(async (prisma) => {
		const delPromise = prisma.productOnOrder.deleteMany({
			where: { orderId: id }
		});
		const orderPromise = prisma.orders.delete({
			where: { id }
		});
		const [deleted, order] = await Promise.all([delPromise, orderPromise]);
		console.log(deleted, order);
		return order;
	});

	return result;
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
