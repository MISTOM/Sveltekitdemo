import { SECRET_KEY } from '$env/static/private';
import bcrypt from 'bcrypt';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

export default {
	/**
	 * Sign payload
	 * @param {import('@prisma/client').User} payload
	 * @returns {String} token
	 */
	sign(payload) {
		//maxAge
		const maxAge = 5 * 60; // 5 minutes
		const id = payload.id;
		const role = payload.roleId;

		return jwt.sign({ id, role }, SECRET_KEY, {
			expiresIn: maxAge
		});
	},

	// async verify(token){

	// }

	/**
	 * Compare Passwords to it's hash
	 * @param {String | Buffer} password
	 * @param {String} hash
	 */
	async compare(password, hash) {
		const validPassword = await bcrypt.compare(password, hash);
		if (!validPassword) throw error(400, 'Invalid password');
	},

	/**
	 *
	 * @param {String | Buffer} password The password to encrypt
	 * @returns Encrypted Password
	 */
	async hash(password) {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(password, salt);
	}
};
