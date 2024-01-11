//create SendMail service
import { BASE_URL, SECRET_KEY, SENDGRID_API_KEY } from '$env/static/private';
import sendgrid from '@sendgrid/mail';
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

	async sendVerificationEmail(email) {
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
};
