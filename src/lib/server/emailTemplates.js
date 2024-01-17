/**
 * Verify Email Template
 * @param {String} name Name of the user
 * @param {String} link Link to verify email
 * @returns {String} HTML template
 */
export const verifyEmailTemplate = (name, link) =>
	`<html>
	<head>
		<style>
			body {
				font-family: Arial, sans-serif;
				background-color: #f2f2f2;
				margin: 0;
				padding: 0;
			}

			.container {
				max-width: 600px;
				margin: 0 auto;
				padding: 20px;
				background-color: #ffffff;
				border-radius: 5px;
				box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
			}

			h1 {
				color: #333333;
				font-size: 24px;
				margin-bottom: 20px;
			}

			h3 {
				color: #333333;
				font-size: 18px;
				margin-bottom: 10px;
			}

			a {
				color: #ffffff;
				background-color: #20466e;
				padding: 10px 20px;
				text-decoration: none;
				border-radius: 5px;
			}

			hr {
				border: none;
				border-top: 1px solid #dddddd;
				margin: 20px 0;
			}

			h4 {
				color: #666666;
				font-size: 14px;
				margin-top: 20px;
			}
		</style>
	</head>

	<body>
		<div class="container">
			<h1>Hello ${name},</h1>
			<h3>Kindly Verify your Email</h3>
			<h3><a href="${link}">Click here to verify your email</a></h3>
			<hr />
			<h4>Sneaker Empire</h4>
		</div>
	</body>
</html>
`;

/**
 * 
 * @param {any} order 
 * @returns 
 */
export const orderEmailTemplate = (order) => 
    `
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
        ${order.products
              .map(
                  (product) => `
          <tr>
            <td>${product.name}</td>
            <td>${product.orderedQuantity}</td>
            <td>${product.price}</td>
            <td> <img src="${product.images[0].url}" alt="${product.name}" width="100" height=100> </td>
            <a href="${product.images[0].url}"> image url here </a>
          </tr>`
              )
              .join('')}
      </tbody>
    </table>

    <p>Your order ID is <pre>${order.orderId}</pre>. The total price is <pre>${order.totalPrice}</pre>.</p>
    
    <p>Thank you for shopping with Sneaker Empire!</p>
  </body>
</html>`