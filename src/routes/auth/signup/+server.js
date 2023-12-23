import { error, json } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '$env/static/private';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Sign up user
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { name, email, password, accountNumber, bankName, branchName } = await request.json();
	if (!name || !email || !password) return error(400, 'Missing required fields');

	const salt = await bcrypt.genSalt();
	const hashedPassword = await bcrypt.hash(password, salt);
	// check if user exists
	const userExists = await prisma.user.findUnique({
		where: {
			email: email
		}
	});
	if (userExists) return error(400, 'User already exists');


	try {
		const user = await prisma.user.create({
			data: {
				name: name,
				email: email,
				password: hashedPassword,
				accountNumber: accountNumber || null,
				bankName: bankName || null,
				branchName: branchName || null,
				roleId: 4
			}
		});
		let id = user.id;
		const maxAge = 5 * 60; //  5 minutes
		const token = jwt.sign({ id }, SECRET_KEY, {
			expiresIn: maxAge
		});
		

		return json({...user, token}, { status: 201 });
	} catch (e) {
		console.log(e);
		return json(e, { status: 500 });
	}
}
