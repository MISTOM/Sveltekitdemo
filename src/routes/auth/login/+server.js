//login the user
//first check if the user has already logged in
// and return the token. client is using Authorization header to send the token so we need to send it back
import { error, json } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '$env/static/private';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { email, password } = await request.json();

	if (!email) return error(400, 'Email is required');
	if (!password) return error(400, 'Password is required');

	console.log('Origin:', request.headers.get('origin'));

	//check if user had already logged in

	const user = await prisma.user.findUnique({
		where: {
			email: email
		}
	});
	if (!user) return error(404, 'User not found');

	const validPassword = await bcrypt.compare(password, user.password);
	if (!validPassword) return error(400, 'Invalid password');

	const maxAge = 5 * 60;
	const token = jwt.sign({ id: user.id, role: user.roleId }, SECRET_KEY, {
		expiresIn: maxAge
	});
	return json({ ...user, token }, { status: 200 });
}
