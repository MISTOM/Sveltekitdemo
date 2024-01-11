//login the user
//first check if the user has already logged in
// and return the token. client is using Authorization header to send the token so we need to send it back
import auth from '$lib/server/auth';
import prisma from '$lib/server/prisma';
import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	// const email = formData?.get('email');
	// const password = formData?.get('password');

	const { email, password } = await request.json();

	if (!email) return error(400, 'Email is required');
	if (!password) return error(400, 'Password is required');

	// console.log('Origin:', request.headers.get('origin'));

	//check if user had already logged in
	let user;
	try {
		user = await prisma.user.findUnique({
			where: {
				email: email.toString()
			}
		});

		if (!user) return error(404, 'User not found');
		if (!user.isVerified)
			return error(401, `Your account is not verified yet. Please check your email: ${email}`);
	} catch (e) {
		console.error(e);
		return error(500, 'An error occurred while trying to find the user');
	}

	// const _token = jwt.sign({email}, SECRET_KEY, {expiresIn: 10 * 60}  );

	await auth.compare(password.toString(), user.password);
	const token = auth.sign(user);
	return json({ ...user, token }, { status: 200 });
}
