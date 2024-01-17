import { error, json } from '@sveltejs/kit';
import auth from '$lib/server/auth';
import prisma from '$lib/server/prisma';
import { SECRET_KEY } from '$env/static/private';
import jwt from 'jsonwebtoken';
import MailService from '$lib/server/MailService';

// Sign up user
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name, email, password, accountNumber, bankName, branchName } = await request.json();

	if (!name || !email || !password) return error(400, 'Missing required fields');

	const hashedPassword = await auth.hash(password);
	// check if user exists
	const userExists = await prisma.user.findUnique({
		where: {
			email: email
		}
	});
	if (userExists) return error(400, 'User already exists');

	try {
		//RoleId 1 is admin, 2 is seller
		const roles = await prisma.role.findMany();
		const role = roles.map((role) => role.id);

		const user = await prisma.user.create({
			data: {
				name: name,
				email: email,
				password: hashedPassword,
				accountNumber: accountNumber || null,
				bankName: bankName || null,
				branchName: branchName || null,
				roleId: role[1]
			}
		});

		// console.log('User here', user);
		// Set up email verification when the user signs up
		await MailService.sendVerificationEmail(user.name, user.email);

		return json({}, { status: 201 });
	} catch (e) {
		console.log(e);
		//@ts-ignore
		return error(e.status, e.message);
	}
}
