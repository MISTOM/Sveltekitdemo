import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME } from '$env/static/private';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: CLOUDINARY_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET
});

/**
 *
 * @param {App.Locals} locals
 * @returns {Promise<import('@prisma/client').Role[]>}
 */
async function getRoles(locals) {
	if (!locals.session.roles) {
		console.log('Querying db for roles');
		locals.session.roles = await prisma.role.findMany();
	}
	return locals.session.roles;
}

// Get all products
/** @type {import('./$types').RequestHandler} */
export async function GET({ url,locals }) {
	const roles = await getRoles(locals);
	const role = roles.map((role) => role.id);



	let whereClause;
	if (locals.user) {
		whereClause = locals.user.role === role[0] ? {} : { sellerId: locals.user.id };
	} else {
		whereClause = { isApproved: true, images: { some: {} } };
	}

	try {

		//Add pagination
		const pageParam = url.searchParams.get('page');
		const limitParam = url.searchParams.get('limit');
		const orderBy = url.searchParams.get('orderBy') === 'asc'? 'asc' : 'desc';

		const page = pageParam ? parseInt(pageParam) : 1;
		const limit = limitParam ? parseInt(limitParam) : 10;
		const skip = (page - 1) * limit;
		

		// Only return products with images and approved
		const productPromise = prisma.product.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: orderBy },
			where: whereClause,
			include: {
				images: true
			}
		});
		const countPromise =  prisma.product.count({ where: whereClause });

		const [products, productCount] = await Promise.all([productPromise, countPromise]);

		const result = {
			products,
			totalPages: Math.ceil(productCount / limit),
			currentPage: page,
			totalProducts: productCount
		};

		return json(result, { status: 200 });
	} catch (e) {
		return error(500, `An error occurred while trying to get the products${e}`);
	}
}

//Create product
export async function POST({ request, locals: { user, formData }, locals }) {
	//check if user is logged in
	if (!user) return error(401, 'Unauthorized: You must be logged in to create a product');
	//check if user is a seller
	const roles = await getRoles(locals);
	const role = roles.map((role) => role.id);

	if (user.role !== role[1])
		return error(401, 'Unauthorized: You must be a seller to create a product');

	// get from formdata entries
	// const {name, price, images=[], description, quantity, } = Object.fromEntries(formData.entries());
	const name = formData.get('name')?.toString();
	const price = formData.get('price')?.toString();
	const images = formData.getAll('images');
	const description = formData.get('description')?.toString();
	const quantity = formData.get('quantity')?.toString();

	if (!name || !price || !images) return error(400, 'Missing required fields: name, price, images');

	//upload images to cloudinary
	/**
	 *
	 */
	const uploadPromises = images.map(async (image) => {
		try {
			const buffer = await new Response(image).arrayBuffer();
			const dataUrl = `data:${image.type};base64,${Buffer.from(buffer).toString('base64')}`;
			const result = await cloudinary.uploader.upload(dataUrl);
			return { url: result.secure_url, publicId: result.public_id };
		} catch (e) {
			console.log(e);
			return error(500, 'Failed to Upload images');
		}
	});
	const uploadedImages = (await Promise.allSettled(uploadPromises))
		.filter((result) => result.status === 'fulfilled')
		// @ts-ignore
		.map((result) => result.value);

	// const { name, description, price, images } = await request.json();

	try {
		// create product and save images
		const result = await prisma.product.create({
			data: {
				name: name.toString(),
				description: description,
				price: parseInt(price),
				quantity: quantity ? parseInt(quantity) : 0,
				sellerId: user.id,
				isApproved: false,
				images: {
					create: uploadedImages
				}
			}
		});
		return json(result, { status: 201 });
	} catch (e) {
		console.log(e);
		return error(500, 'An error occurred while trying to create the product');
	}
}
