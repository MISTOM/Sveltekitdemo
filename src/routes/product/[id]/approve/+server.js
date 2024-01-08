//approve a product

import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

async function getRoles(locals) {
	if (!locals.session.roles) locals.session.roles = await prisma.role.findMany();
	return locals.session.roles;
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, url, locals }) {
	const roles = await getRoles(locals);
	//check if user is logged in
	if (!locals.user) return error(401, 'Unauthorized: You must be logged in to approve a product');
	// //check if user is a admin
	if (locals.user.role !== roles[0].id)
		return error(401, 'Unauthorized: You must be an admin to approve a product');

	const isApprove = url.searchParams.get('isApprove');
	const { id } = params;
	if (!id) return error(400, 'Product ID not provided to approve');

	const product = await prisma.product.findUnique({
		where: {
			id: Number(params.id)
		}
	});
	if (!product) return error(404, 'Product to approve not found');

	try {
		const result = await prisma.product.update({
			where: {
				id: Number(id)
			},
			data: {
				isApproved: isApprove === 'true'
			}
		});

		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
