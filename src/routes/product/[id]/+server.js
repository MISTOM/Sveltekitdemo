//Get product by id

import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export async function GET({ params }) {
	try {
		const result = await prisma.product.findUnique({
			where: {
				id: Number(params.id)
			}
		});

		if (result) {
			return json(result, { status: 200 });
		} else return json({ message: 'Product not found' }, { status: 404 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Update product by id
export async function PUT({ params, request, locals }) {
	if (!params.id) return json({ message: 'Product ID not provided to update' }, { status: 400 });

	//check if user is logged in
	if (!locals.user) return error(401, 'Unauthorized: You must be logged in to update a product');

	//check if user is a seller ????
	const role = await prisma.role.findMany();
	const roleId = role.map((role) => role.id);
	if (locals.user.role !== roleId[1])
		return error(401, 'Unauthorized: You must be a seller to update a product');

	//check if user is the owner of the product
	const product = await prisma.product.findUnique({
		where: {
			id: Number(params.id)
		}
	});
	if (!product) return error(404, 'Product to update not found');
	if (product?.sellerId !== locals.user.id)
		return error(401, 'Unauthorized: You must be the owner of the product to update it');

	const { name, description, price, images, quantity } = await request.json();
	try {
		const result = await prisma.product.update({
			where: {
				id: Number(params.id)
			},
			data: {
				name: name || product.name,
				description: description || product.description,
				price: price || product.price,
				images: images || product.images,
				quantity: quantity || product.quantity
			}
		});
		return json(result, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Delete product by id
export async function DELETE({ params, locals }) {
	if (!params.id) return json({ message: 'Product ID not provided to delete' }, { status: 400 });
	// seller can only delete their own product ✓✓
	// admin can delete any product

	if (!locals.user) return error(401, 'Unauthorized: You must be logged in to delete a product');

	//check if user is the owner of the product
	const product = await prisma.product.findUnique({
		where: {
			id: Number(params.id)
		}
	});
	if (!product) return error(404, 'Product to delete not found');
	if (product?.sellerId !== locals.user.id)
		return error(401, 'Unauthorized: You must be the owner of the product to delete it');

	try {
		const result = await prisma.product.delete({
			where: {
				id: Number(params.id)
			}
		});

		if (result) return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
