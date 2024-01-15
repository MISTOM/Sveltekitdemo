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
			html: `
			  <html>
				<head>
				  <style>
					body {
					  font-family: 'Arial', sans-serif;
					  line-height: 1.6;
					  color: #333;
					}
					h3 {
					  color: #007BFF;
					}
					table {
					  width: 100%;
					  border-collapse: collapse;
					  margin-top: 20px;
					}
					th, td {
					  border: 1px solid #ddd;
					  padding: 12px;
					  text-align: left;
					}
					th {
					  background-color: #f2f2f2;
					}
				  </style>
				</head>
				<body>
				  <h3>Your Order Confirmation</h3>
				  <p>Dear ${order.buyerName},</p>
				  <p>Your order has been created successfully. Below are the details:</p>
				  <strong>${order.buyerEmail}, ${order.buyerPhone}</strong>
				  
				  <table>
					<thead>
					  <tr>
						<th>Product</th>
						<th>Quantity</th>
						<th>Price</th>
						<th>Image</th>
					  </tr>
					</thead>
					<tbody>
					  ${order.products.map(product => `
						<tr>
						  <td>${product.name}</td>
						  <td>${product.orderedQuantity}</td>
						  <td>${product.price}</td>
						  <td> <img src="${product.images[0].url}" alt="${product.name}" width="100" height=100> </td>
						  <a href="${product.images[0].url}"> image url here </a>
						</tr>`).join('')}
					</tbody>
				  </table>
		  
				  <p>Your order ID is <pre>${order.orderId}</pre>. The total price is <pre>${order.totalPrice}</pre>.</p>
				  
				  <p>Thank you for shopping with Sneaker Empire!</p>
				</body>
			  </html>
			`,
		  };

		await this.sendMail(mail);
	}
};
