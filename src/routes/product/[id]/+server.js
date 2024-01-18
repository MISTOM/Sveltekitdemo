//Get product by id

import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import cloudinary from '$lib/server/cloudinary.js';

/**
 * @type {import('@prisma/client').Role[]}
 */
let roleCache;
async function getRoles() {
	if (!roleCache) {
		console.log('Querying db for roles');
		roleCache = await prisma.role.findMany();
	}
	return roleCache;
}
export async function GET({ params }) {
	try {
		const result = await prisma.product.findUnique({
			where: {
				id: parseInt(params.id)
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
export async function PUT({ params, locals }) {
	if (!params.id) return json({ message: 'Product ID not provided to update' }, { status: 400 });

	//check if user is logged in
	if (!locals.user) return error(401, 'Unauthorized: You must be logged in to update a product');

	//check if user is a seller
	const roles = await getRoles();
	if (locals.user.role !== roles[1].id)
		return error(401, 'Unauthorized: You must be a seller to update a product');

	//check if user is the owner of the product
	const product = await prisma.product.findUnique({
		where: {
			id: parseInt(params.id)
		},
		include: { images: true }
	});

	if (!product) return error(404, 'Product to update not found');
	if (product?.sellerId !== locals.user.id)
		return error(401, 'Unauthorized: You must be the owner of the product to update it');

	const name = locals.formData.get('name')?.toString();
	const description = locals.formData.get('description')?.toString();
	const price = locals.formData.get('price')?.toString();
	const images = locals.formData.getAll('images');
	const quantity = locals.formData.get('quantity')?.toString();
	const categoriesId = locals.formData.getAll('categoriesId'); // example ['1', '2']
	const toDeletePublicIds = locals.formData.getAll('toDeletePublicIds'); // This should be an array of publicIds of the images to delete: example ['publicId1', 'publicId2']

	try {
		if (toDeletePublicIds?.length === 0 && images?.length === 0) {
			const updatedProduct = await prisma.product.update({
				where: { id: parseInt(params.id) },
				data: {
					name: name ? name : undefined,
					description: description ? description : undefined,
					price: price ? parseInt(price) : undefined,
					quantity: quantity ? parseInt(quantity) : undefined
				}, include: { images: true, categories: true }
			});

			if (categoriesId?.length === 0) return json(updatedProduct, { status: 201 });
			//validate categories

			//Add Categories in a transaction
			//check if the category id is a number when converting from string
			const categoryIds = categoriesId.map((categoryId) => {
				const id = parseInt(categoryId);
				if (categoryId === '' || isNaN(id)) throw error(400, 'Invalid or Empty category id');
				return id;
			});
			const productCategories = categoryIds.map((categoryId) => ({
				productId: parseInt(params.id),
				categoryId: categoryId
			}));

			/** @type {any} */
			let deleteOldCategoriesPromise
			if (categoriesId?.length !== 0 ) {
				deleteOldCategoriesPromise = prisma.productCategory.deleteMany({
					where: {
						productId: parseInt(params.id)
					}
				});
			}
			// Create new associations with the updated categories
			const createNewCategoriesPromise = prisma.productCategory.createMany({
				data: productCategories
			});

			const [deleteCategoriesRes, createCategoryRes] = await prisma.$transaction([
				deleteOldCategoriesPromise,
				createNewCategoriesPromise
			]);
			console.log(
				'Deleted Category Res:',
				deleteCategoriesRes,
				'Created Category Res: ',
				createCategoryRes
			);

			return json(updatedProduct, { status: 201 });
		}

		console.log('Formdata Images', images);

		// Delete the old images from Cloudinary if there are toDeletePublicIds
		if (toDeletePublicIds && toDeletePublicIds.length > 0) {
			const deletePromises = toDeletePublicIds.map((publicId) =>
				cloudinary.uploader.destroy(publicId, { invalidate: true })
			);
			await Promise.all(deletePromises).catch((e) => {
				return error(500, `Failed to delete images${e}`);
			});
		}

		
		// Update the product and images in a prisma transaction
		return prisma.$transaction(async (prisma) => {
			console.log("Category ids here: ",categoriesId )
			
			const categoryIds = categoriesId.map((categoryId) => {
				const id = parseInt(categoryId);
				if (categoryId === '' || isNaN(id)) throw error(400, 'Invalid or Empty category id');
				return id;
			});

			const productCategories = categoryIds.map((categoryId) => ({
				productId: parseInt(params.id),
				categoryId: categoryId
			}));

			let deleteOldCategoriesPromise;
			if (categoriesId?.length !== 0 ) {
			deleteOldCategoriesPromise = prisma.productCategory.deleteMany({
				where: {
					productId: parseInt(params.id)
				}
			});
		}

			// Create new associations with the updated categories
			const createNewCategoriesPromise = prisma.productCategory.createMany({
				data: productCategories
			});

			// Insert new images to Cloudinary if there are images
			/**
			 * @type {Array<{url: string, publicId: string}>}
			*/
			let uploadedImages = [];
			if (images && images.length > 0) {
				const uploadPromises = images.map(async (image) => {
					try {
						const buffer = await new Response(image).arrayBuffer();
						const dataUrl = `data:${image.type};base64,${Buffer.from(buffer).toString('base64')}`;
						const result = await cloudinary.uploader.upload(dataUrl);
						return { url: result.secure_url, publicId: result.public_id };
					} catch (e) {
						console.log(e);
						return error(500, `Failed to Upload images${e}`);
					}
				});

				uploadedImages = (await Promise.allSettled(uploadPromises))
					.filter((result) => result.status === 'fulfilled')
					// @ts-ignore
					.map((result) => result.value);
			}

			// Delete the old images from the database
			const _toDeletePublicIds = toDeletePublicIds.map((publicId) => publicId.toString());
			const deletedImagesPromise = prisma.image.deleteMany({
				where: {
					productId: parseInt(params.id),
					publicId: { in: _toDeletePublicIds }
				}
			});

			// Insert the new images to the database
			const uploadedImagesWithProductId = uploadedImages.map((image) => ({
				...image,
				productId: parseInt(params.id)
			}));
			const newImagesPromise = prisma.image.createMany({
				data: uploadedImagesWithProductId
			});

			// Update the product
			const updatedProductPromise = prisma.product.update({
				where: {
					id: parseInt(params.id)
				},
				data: {
					name: name ? name : undefined,
					description: description ? description : undefined,
					price: price ? parseInt(price) : undefined,
					quantity: quantity ? parseInt(quantity) : undefined
				},
				include: { images: true, categories: true }
			});

			

			const result = await Promise.all([
				deleteOldCategoriesPromise,
				createNewCategoriesPromise,
				deletedImagesPromise,
				newImagesPromise,
				updatedProductPromise
			]);
			console.log(result);

			return json(result[4], { status: 201 });
		});
	} catch (e) {
		console.log(e);
		// @ts-ignore
		if (e.status !== 500) return error(e.status, e.body);
		return error(500, `An error occurred while trying to update the product ${e}`);
	}
}

// Delete product by id
export async function DELETE({ params, locals }) {
	if (!params.id) return error(404, 'Product ID not provided to delete');
	// seller can only delete their own product ✓✓
	// admin can delete any product

	if (!locals.user) return error(401, 'Unauthorized: You must be logged in to delete a product');

	// You cant delete products that are on order Either cascade delete after checking if the order is delivered of set the foreign key to null.

	//check if user is the owner of the product
	const product = await prisma.product.findUnique({
		where: {
			id: parseInt(params.id)
		},
		select: {
			images: true,
			sellerId: true
		}
	});

	const roles = await getRoles();
	if (!product) return error(404, 'Product to delete not found');

	//check if user is a admin
	if (locals.user.role !== roles[0].id) {
		if (product.sellerId !== locals.user.id)
			return error(401, 'Unauthorized: You must be the owner of the product to delete it');
	}

	try {
		//delete images from cloudinary
		const publicIds = product.images.map((image) => image.publicId);
		const deleteImagePromises = publicIds.map((publicId) => cloudinary.uploader.destroy(publicId));

		//delete images from database
		// const delImagesPromise = prisma.image.deleteMany({
		// 	where: {
		// 		productId: parseInt(params.id)
		// 	}
		// });

		//delete product from database
		const delProductPromise = prisma.product.delete({
			where: {
				id: parseInt(params.id)
			},
			include: { images: true }
		});
		const result = await Promise.all([...deleteImagePromises, delProductPromise]);
		console.log(result);

		return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		return error(500, 'Error deleting product');
	}
}
