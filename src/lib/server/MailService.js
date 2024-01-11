//create SendMail service
import { SENDGRID_API_KEY } from '$env/static/private';
import sendgrid from '@sendgrid/mail';
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
	}
};
