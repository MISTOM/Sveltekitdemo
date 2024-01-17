import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

/** @type {import('@prisma/client').Role[]} */
let roleCache;
async function getRoles() {
	if (!roleCache) {
		console.log('Querying db for roles');
		roleCache = await prisma.role.findMany();
	}
	return roleCache;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals: { user } }) {
	const roles = await getRoles();
	if (!user || user.role !== roles[1].id) {
		return error(401, 'Unauthorized');
	}

	//Add pagination
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const orderBy = url.searchParams.get('orderBy') === 'asc' ? 'asc' : 'desc';

	const page = pageParam ? parseInt(pageParam) : 1;
	const limit = limitParam ? parseInt(limitParam) : 10;
	const skip = (page - 1) * limit;

	const categories = url.searchParams.get('categories');
	const categoryNames = categories?.split(',');
	if (categories) console.log('Categories here:', categoryNames);

	/**
	 * @type {import('@prisma/client').Prisma.ProductWhereInput}
	 */
	let whereClause = {
		sellerId: user.id,
		categories: {
			some: {
				category: {
					name: {
						in: categoryNames
					}
				}
			}
		}
	};

	try {
		const productPromise = prisma.product.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: orderBy },
			where: whereClause,
			include: {
				images: true,
				categories: {
					include: {
						category: true
					}
				}
			}
		});
		const countPromise = prisma.product.count({ where: whereClause });

		const [products, productCount] = await Promise.all([productPromise, countPromise]);

		const result = {
			products,
			currentPage: page,
			totalPages: Math.ceil(productCount / limit),
			totalProducts: productCount
		};

		return json(result, { status: 200 });
	} catch (e) {
		return error(500, `An error occurred while trying to get the products${e}`);
	}
}
