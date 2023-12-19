//approve a product

import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, url }) {
	const isApprove = url.searchParams.get('isApprove');
	const { id } = params;
	if (!id) return json({ message: 'Product ID not provided to approve' }, { status: 400 });

    const product = await prisma.products.findUnique({
        where: {
            id: Number(params.id)
        }
    })
    if(!product) return json({ message: 'Product to approve/disapprove not found' }, { status: 404 });


	if (isApprove === 'false') {
		try {
            console.log('disapproving')
            
			const result = await prisma.products.update({
				where: {
					id: Number(id)
				},
				data: {
					isApproved: false
				}
			});
			return json(result, { status: 200 });
		} catch (e) {
			console.log(e);
			return json(e, { status: 500 });
		}
	} else {
		try {
            console.log('approving')
			const result = await prisma.products.update({
				where: {
					id: Number(id)
				},
				data: {
					isApproved: true
				}
			});
			return json(result, { status: 200 });
		} catch (e) {
			console.log(e);
			return json(e, { status: 500 });
		}
	}
}
