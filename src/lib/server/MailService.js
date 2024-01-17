//create SendMail service
import { BASE_URL, SECRET_KEY, SENDGRID_API_KEY } from '$env/static/private';
import sendgrid from '@sendgrid/mail';
import { error } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { verifyEmailTemplate, orderEmailTemplate } from '$lib/server/emailTemplates';

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
	 * @param {String} name
	 * @param {String} email
	 */
	async sendVerificationEmail(name, email) {
		//validate the email
		if (!email) throw error(400, 'Email is required');

		const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: 10 * 60 });
		const link = `${BASE_URL}/verify?token=${token}`;
		const devLink = `http://localhost:5174/verify?token=${token}`;
		const mail = {
			to: email,
			subject: 'Verify your email',
			text: `Click on this link to verify your email ${link}`,
			html: verifyEmailTemplate(name, devLink)
		};
		await this.sendMail(mail);
	},

	/**
	 *
	 * @param {String} buyerEmail
	 */
	async sendOrderEmail(buyerEmail, order) {
		const mail = {
			to: buyerEmail,
			subject: 'Order Confirmation - Your Order Details',
			text: `Dear ${order.buyerName},\n\nYour order was created successfully. Your order ID is ${order.orderId}. The total price is ${order.totalPrice}. Thank you for shopping with Sneaker Empire!`,
			html: orderEmailTemplate(order)
		};

		await this.sendMail(mail);
	}
};
