// verify email
import { json, error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '$env/static/private';
import prisma from '$lib/server/prisma';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const token = url.searchParams.get('token');
	if (!token) return error(400, 'Token is required');

	try {
		const decoded = jwt.verify(token, SECRET_KEY);
		const { email } = decoded;
		const user = await prisma.user.findUnique({
			where: {
				email: email
			}
		});
		if (!user) return error(404, 'User not found');
		if (user.isVerified) return error(400, 'User is already verified');
		
		await prisma.user.update({
			where: {
				email: email
			},
			data: {
				isVerified: true
			}
		});
		return json({ message: 'Email verified successfully' }, { status: 200 });
	} catch (e) {
		console.log(e);
		return error(500, `Failed to verify email ${e}`);
	}
}
