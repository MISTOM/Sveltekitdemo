//create SendMail service
import { BASE_URL, SECRET_KEY, SENDGRID_API_KEY } from '$env/static/private';
import sendgrid from '@sendgrid/mail';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

sendgrid.setApiKey(SENDGRID_API_KEY);

export default {
	/**
	 * Send mail
	 * @param {Object} mail
	 * @param {String} mail.to
	 * @param {String} mail.subject
	 * @param {String} mail.text
	 * @param {String} mail.html
	 */
	async sendMail({ to, subject, text, html }) {
		const Identity = 'kigardetom2001+sne@gmail.com';
		const msg = {
			to,
			from: Identity,
			subject,
			text,
			html
		};
		await sendgrid.send(msg);
	},

	/**
	 * Sends a verification email to the user
	 * @param {String} email
	 */
	async sendVerificationEmail(email) {
		//validate the email
		if (!email) throw error(400, 'Email is required');

		

		const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: 10 * 60 });
		const link = `${BASE_URL}/verify?token=${token}`;
		const mail = {
			to: email,
			subject: 'Verify your email',
			text: `Click on the link to verify your email ${link}`,
			html: `<h3><a href="${link}">Click here to verify your email</a></h3>`
		};
		await this.sendMail(mail);
	}

	// async sendOrderEmail(emails, buyerName, buyerEmail, buyerPhone, orderId) {
	// 	const mail = {
	// 		to: emails,
	// 		subject: 'New order',
	// 		text: `A new order was created by ${buyerName}. Order id is ${orderId}. Buyer email is ${buyerEmail}. Buyer phone is ${buyerPhone}`,
	// 		html: `<h3>A new order was created by ${buyerName}</h3><br><p>Order id is ${orderId}. Buyer email is ${buyerEmail}. Buyer phone is ${buyerPhone}</p><br>`
	// 	};
	// 	await this.sendMail(mail);
	// }
};
