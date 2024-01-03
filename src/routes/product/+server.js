import { v2 as cloudinary } from 'cloudinary';
import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import {CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET} from '$env/static/private'


cloudinary.config({
	cloud_name: 'dya9eyh8f',
	api_key: CLOUDINARY_API_KEY ,
	api_secret: CLOUDINARY_API_SECRET,
})

// Get all products
/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { user } }) {
	const roles = await prisma.role.findMany();
	const role = roles.map((role) => role.id);

	let whereClause
	if (user){
		whereClause = user.role === role[0] ? {} : { sellerId: user.id };
	} else{
		whereClause = { isApproved: true };
	}

	try {
		const result = await prisma.product.findMany({
			where: whereClause
		})

		return json(result, { status: 200 });
	} catch (error) {
		return json(error, { status: 500 });
	}
}

//Create product
export async function POST({ request, locals: { user, formData }}) {
	//check if user is logged in
	if (!user) return error(401, 'Unauthorized: You must be logged in to create a product');
	//check if user is a seller
	const roles = await prisma.role.findMany();
	const role = roles.map((role) => role.id);

	if (user.role !== role[1])
		return error(401, 'Unauthorized: You must be a seller to create a product');

	const name = formData.get('name');
	const description = formData.get('description')?.toString();
	const price = formData.get('price');
	const images = formData.getAll('images');

	const uploadPromises = images.map(async image => {
		const buffer = await new Response(image).arrayBuffer()
		const dataUrl = `data:${image.type};base64,${Buffer.from(buffer).toString('base64')}`
		const result = await cloudinary.uploader.upload(dataUrl);
		return result.secure_url;
	})
	const uploadedImages = await Promise.all(uploadPromises)



	// const { name, description, price, images } = await request.json();
	if (!name || !price || !images) return error(400, 'Missing required fields');

	try {
		const result = await prisma.product.create({
			data: {
				name: name.toString(),
				description: description,
				price: parseInt(price),
				images: JSON.stringify(uploadedImages),
				sellerId: user.id,
				isApproved: false
			}
		});
		return json(result, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
