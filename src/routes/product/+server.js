import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import cloudinary from '$lib/server/cloudinary';
// import MailService from '$lib/server/MailService';

// const msg = {
// 	to: 'kigardetom2001@gmail.com',
// 	subject: 'Test Email',
// 	text: 'This is a test email',
// 	html: '<h1>This is a test email</h1>'
// };

// MailService.sendMail(msg);

/** @type {import('@prisma/client').Role[]} */
let roleCache;
async function getRoles() {
	if (!roleCache) {
		console.log('Querying db for roles');
		roleCache = await prisma.role.findMany();
	}
	return roleCache;
}

// Get all products
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
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

	let whereClause = {
		isApproved: true,
		images: { some: {} },
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
		// Only return products with images and approved
		const productPromise = prisma.product.findMany({
			skip,
			take: limit,
			orderBy: { createdAt: orderBy },
			where: {},
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
	const roles = await getRoles();

	if (user.role !== roles[1].id)
		return error(401, 'Unauthorized: You must be a seller to create a product');

	// get from formdata entries
	// const {name, price, images=[], description, quantity, } = Object.fromEntries(formData.entries());
	const name = formData.get('name')?.toString();
	const price = formData.get('price')?.toString();
	const images = formData.getAll('images');
	const description = formData.get('description')?.toString();
	const quantity = formData.get('quantity')?.toString();
	const categories = formData.getAll('categories'); // convert to array of strings from formDataValues
	const shoeSize = formData.get('shoeSize')?.toString();

	if (!name || !price || !images) return error(400, 'Missing required fields: name, price, images');

	/**
	 * Validate categories and return their ids
	 * @param {String[]} categories
	 * @returns
	 */
	async function validateCategories(categories) {
		//check if categories is available, if not retrun an empty array
		console.log('Inside Validate', categories);
		if (!categories || categories.length === 0) return [];
		const categoryIds = categories.map((category) => {
			const id = parseInt(category);
			if (category === '' || isNaN(id)) throw error(400, 'Invalid or Empty category id');
			return id;
		});

		// Fetch all categories from the database
		const _categories = await Promise.all(
			categoryIds.map((id) => prisma.category.findUnique({ where: { id } }))
		);

		// Check if any category is null or undefined
		const allCategoriesValid = _categories.every(
			(category) => category !== null && category !== undefined
		);
		if (!allCategoriesValid) return error(400, 'One or more Invalid category ids');
		return categoryIds;
	}
	const categoryIds = await validateCategories(categories);

	//upload images to cloudinary
	const uploadPromises = images.map(async (image) => {
		try {
			const buffer = await new Response(image).arrayBuffer();
			//@ts-ignore
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

		let productData = {
			name: name.toString(),
			description: description ? description : '',
			price: parseInt(price),
			quantity: quantity ? parseInt(quantity) : undefined,
			shoeSize: shoeSize ? parseInt(shoeSize) : undefined,
			sellerId: user.id,
			isApproved: false,
			images: {
				create: uploadedImages
			}
		};
		const product = await prisma.product.create({
			data: productData,
			include: {
				images: true,
				categories: true
			}
		});
		console.log('product', product, 'Categories', categoryIds);
		if (categoryIds.length === 0) return json(product, { status: 201 });

		//add categories to product
		console.log('Adding categories to product');
		const categoriesData = categoryIds.map((id) => ({ productId: product.id, categoryId: id }));
		await prisma.productCategory.createMany({
			data: categoriesData
		});
		return json(product, { status: 201 });
	} catch (e) {
		console.log(e);
		return error(500, 'An error occurred while trying to create the product');
	}
}

// TODO: 📌
// Upload images to Cloudinary
// const uploadPromises = images.map((image) => {
// 	return new Promise((resolve, reject) => {
// 	  // Create a stream for uploading the image to Cloudinary
// 	  const stream = cloudinary.v2.uploader.upload_stream((error, result) => {
// 		if (error || !result) {
// 		  // If there's an error or no result, reject the promise
// 		  reject(error || new Error('Failed to upload image'));
// 		} else {
// 		  // If the upload is successful, resolve the promise with the image URL and public ID
// 		  resolve({ url: result.secure_url, publicId: result.public_id });
// 		}
// 	  });

// 	  // Convert the image to a stream and pipe it to Cloudinary
// 	  const buffer = new Response(image).arrayBuffer();
// 	  const readableStream = new Readable();
// 	  readableStream.push(buffer);
// 	  readableStream.push(null);
// 	  readableStream.pipe(stream);
// 	});
//   });

//   // Wait for all image uploads to complete
//   Promise.allSettled(uploadPromises).then((uploadResults) => {
// 	// Filter out any rejected promises
// 	const errors = uploadResults.filter((result) => result.status === 'rejected');
// 	if (errors.length > 0) {
// 	  // If there are any errors, log them and return an error response
// 	  console.log(errors.map((error) => error.reason));
// 	  return error(500, 'Failed to upload images');
// 	}

// 	// Filter out the successful uploads and get the value of each one
// 	const uploadedImages = uploadResults
// 	  .filter((result) => result.status === 'fulfilled')
// 	  .map((result) => result.value);
//   });
