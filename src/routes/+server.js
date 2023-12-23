/** @type {import('./$types').RequestHandler} */
export async function GET({request}) {
	const res = 'you have reached this server hooray!!';
	return new Response(res);
}

// async function createOrder(sellerId, products, buyerName, buyerEmail, buyerPhone, totalPrice) {
// 	// Start a transaction
// 	const result = await prisma.$transaction(async (prisma) => {
// 		// Create the order
// 		const order = await prisma.orders.create({
// 			data: {
// 				sellerId: sellerId,
// 				buyerName: buyerName,
// 				buyerEmail: buyerEmail,
// 				buyerPhone: buyerPhone,
// 				totalPrice: totalPrice,
// 				isDelivered: false
// 			}
// 		});

// 		// For each product in the order, create an entry in the join table
// 		for (const product of products) {
// 			await prisma.productOnOrder.create({
// 				data: {
// 					orderId: order.id,
// 					productId: product.id,
// 					quantity: product.quantity
// 				}
// 			});
// 		}

// 		return order;
// 	});

// 	return result;
// }

// Use the function
// createOrder(
// 	sellerId,
// 	[
// 		{ id: productId1, quantity: 3 },
// 		{ id: productId2, quantity: 1 }
// 	],
// 	buyerName,
// 	buyerEmail,
// 	buyerPhone,
// 	totalPrice
// )
// 	.then((order) => console.log('Order created:', order))
// 	.catch((error) => console.error('Error:', error))
// 	.finally(() => prisma.$disconnect());
