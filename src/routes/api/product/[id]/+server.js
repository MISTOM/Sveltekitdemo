//Get product by id

import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET({ params }) {
	try {
		const result = await prisma.products.findUnique({
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
export async function PUT({ params, request }) {
	if (!params.id) return json({ message: 'Product ID not provided to update' }, { status: 400 });

	const { name, description, price, images } = await request.json();
	try {
        const product = await prisma.products.findUnique({
            where: {
                id: Number(params.id)
            }
        })
        if(!product) return json({ message: 'Product to update not found' }, { status: 404 });

		const result = await prisma.products.update({
			where: {
				id: Number(params.id)
			},
			data: {
				name: name,
				description: description,
				price: price,
				images: images
			}
		});

	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}

// Delete product by id
export async function DELETE({ params }) {
	if (!params.id) return json({ message: 'Product ID not provided to delete' }, { status: 400 });

	try {
        const product = await prisma.products.findUnique({
            where: {
                id: Number(params.id)
            }
        })
        if(!product) return json({ message: 'Product to delete not found' }, { status: 404 });

		const result = await prisma.products.delete({
			where: {
				id: Number(params.id)
			}
		});

		if (result) return json(result, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
