import { error, json } from '@sveltejs/kit';
import auth from '$lib/server/auth';
import prisma from '$lib/server/prisma';

// Sign up user
/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals: { data } }) {
	const name = data?.get('name')?.toString();
	const email = data?.get('email')?.toString();
	const password = data?.get('password')?.toString();
	const accountNumber = data?.get('accountNumber')?.toString();
	const bankName = data?.get('bankName')?.toString();
	const branchName = data?.get('branchName')?.toString();

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

		console.log('User here', user);

		const token = auth.sign(user);

		return json({ ...user, token }, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
