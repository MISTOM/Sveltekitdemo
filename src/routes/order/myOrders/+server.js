// // get orders by email

import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
// //this is my schema file,
// model Product {
//   id          Int     @id @default(autoincrement())
//   name        String  @db.VarChar(255)
//   description String?  @db.Text
//   price       Int
//   quantity   Int @default(0)
//   sellerId    Int
//   seller      User  @relation(fields: [sellerId], references: [id])
//   isApproved  Boolean @default(false)
//   orders      ProductOnOrder[]
//   images      Image[]
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt @default(now())
// }

// model Image {
//   id        Int     @id @default(autoincrement())
//   url       String  @db.Text
//   publicId  String  @db.VarChar(255)
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
//   productId Int
//   product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
// }

// // there is no buyer account hence the buyerid is not needed
// model Orders {
//   id         Int      @id @default(autoincrement())
//   buyerName  String   @db.VarChar(255)
//   buyerEmail String   @db.VarChar(255)
//   buyerPhone String   @db.VarChar(255)
//   totalPrice Int
//   isDelivered Boolean @default(false)
//   products ProductOnOrder[]
//   createdAt  DateTime @default(now())
//   updatedAt  DateTime @updatedAt
// }

// model ProductOnOrder{
//   orderId Int
//   productId Int
//   quantity Int
//   sellerId Int
//   seller User @relation(fields: [sellerId], references: [id])
//   order Orders @relation(fields: [orderId], references: [id])
//   product Product @relation(fields: [productId], references: [id])

//   @@id([orderId, productId])
//   createdAt  DateTime @default(now())
//   updatedAt  DateTime @updatedAt
// }

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { email } = await request.json();

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
