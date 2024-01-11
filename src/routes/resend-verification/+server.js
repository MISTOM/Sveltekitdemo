//resend verification email
import { error, json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import MailService from '$lib/server/MailService';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { email } = await request.json();
	if (!email) return error(400, 'Email is required');
	let user;

	try {
		// check if user exists
		user = await prisma.user.findUnique({
			where: {
				email: email
			}
		});
        if (!user) return error(404, 'User not found');
        if (user.isVerified) return error(400, 'User is already verified');

		await MailService.sendVerificationEmail(user.email);
		return json({ message: 'Email verification sent successfully' }, { status: 200 });
	} catch (e) {
		console.log(e);
		return error(500, `Failed to find user ${e}`);
	}
}
