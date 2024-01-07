//Get product by id

import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME } from '$env/static/private';
import { v2 as cloudinary } from 'cloudinary';
import { parse } from 'path';

cloudinary.config({
	cloud_name: CLOUDINARY_NAME,
	api_key: CLOUDINARY_API_KEY,
	api_secret: CLOUDINARY_API_SECRET
});

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
			id: parseInt(params.id)
		},
		select: { sellerId: true, images: true }
	});

	if (!product) return error(404, 'Product to update not found');
	if (product?.sellerId !== locals.user.id)
		return error(401, 'Unauthorized: You must be the owner of the product to update it');

	const name = locals.formData.get('name')?.toString();
	const description = locals.formData.get('description')?.toString();
	const price = parseInt(locals.formData.get('price'));
	const images = locals.formData.getAll('images');
	const quantity = parseInt(locals.formData.get('quantity'));
	const toDeletePublicIds = locals.formData.getAll('toDeletePublicIds'); // This should be an array of publicIds of the images to delete: example ['publicId1', 'publicId2']

	try {
		if (toDeletePublicIds?.length === 0 && images?.length === 0) {
			const updatedProduct = await prisma.product.update({
				where: { id: parseInt(params.id) },
				data: {
					name: name ? name : undefined,
					description: description ? description : undefined,
					price: price ? price : undefined,
					quantity: quantity ? quantity : undefined
				}
			});

			return json(updatedProduct, { status: 201 });
		}

		// Parse the old images
		const oldImages = JSON.parse(product.images);

		// Upload the new images to Cloudinary
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
			.map((result) => result.value);

		console.log(toDeletePublicIds);

		// Delete the old images from Cloudinary
		const deletePromises = toDeletePublicIds.map((publicId) =>
			cloudinary.uploader
				.destroy(publicId)
				.then((result) => {
					console.log(`Deleted image with publicId ${publicId}: ${JSON.stringify(result)}`);
					return result;
				})
				.catch((error) => {
					console.error(`Failed to delete image with publicId ${publicId}: ${error}`);
				})
		);
		await Promise.all(deletePromises);

		// Remove the old images from the array
		const remainingImages = oldImages.filter(
			(image) => !toDeletePublicIds.includes(image.publicId)
		);
		console.log(`Remaining images: ${remainingImages}`);

		// Add the new images to the array
		const updatedImages = [...remainingImages, ...uploadedImages];

		// Update the product
		const updatedProduct = await prisma.product.update({
			where: {
				id: parseInt(params.id)
			},
			data: {
				name: name ? name : undefined,
				description: description ? description : undefined,
				price: price ? price : undefined,
				quantity: quantity ? quantity : undefined,
				images: updatedImages.length > 0 ? JSON.stringify(updatedImages) : undefined
			}
		});
		return json(updatedProduct, { status: 201 });
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
	if (!product) return error(404, 'Product to delete not found');
	if (product?.sellerId !== locals.user.id)
		return error(401, 'Unauthorized: You must be the owner of the product to delete it');

	try {
		//delete images from cloudinary
		const publicIds = JSON.parse(product.images).map((image) => image.publicId);
		const deletePromises = publicIds.map((publicId) => cloudinary.uploader.destroy(publicId));

		//delete product from database
		const delPromise = prisma.product.delete({
			where: {
				id: parseInt(params.id)
			}
		});
		const result = await Promise.all([delPromise, ...deletePromises]);
		console.log(result);

		if (result) return json(result, { status: 200 });
	} catch (e) {
		console.log(e);
		//@ts-ignore
		return error(e.status, e.message);
	}
}

// // Parse the old images
// const oldImages = JSON.parse(product.images);

// // Upload the new images to Cloudinary
// const newImageFiles = locals.formData.getAll('newImages'); // This should be an array of new image files from the request
// const uploadPromises = newImageFiles.map(imageFile => cloudinary.uploader.upload(imageFile.path));
// const uploadedImages = await Promise.all(uploadPromises);

// // Prepare the new images for the database
// const newImages = uploadedImages.map(uploadedImage => ({
//     url: uploadedImage.secure_url,
//     publicId: uploadedImage.public_id
// }));

// // Remove the old images from the array
// const oldImagePublicIds = locals.formData.getAll('oldImagePublicIds'); // This should be an array of publicIds of the images to delete
// const remainingImages = oldImages.filter(image => !oldImagePublicIds.includes(image.publicId));

// // Add the new images to the array
// const updatedImages = [...remainingImages, ...newImages];

// // Delete the old images from Cloudinary
// const deletePromises = oldImagePublicIds.map(publicId => cloudinary.uploader.destroy(publicId));
// await Promise.all(deletePromises);

// // Update the product
// const updatedProduct = await prisma.product.update({
//     where: {
//         id: Number(params.id)
//     },
//     data: {
//         images: JSON.stringify(updatedImages),
//     },
// });

// ...
