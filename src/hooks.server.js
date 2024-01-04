import { SECRET_KEY } from '$env/static/private';
import jwt from 'jsonwebtoken';

/**
 * @type import('@sveltejs/kit').Handle
 */
export const handle = async ({ event, resolve }) => {
	const token = event.request.headers.get('Authorization')?.split(' ')[1]; // Bearer <token>
	const origin = event.request.headers.get('origin');
	const contentType = event.request.headers.get('content-type');

	// Apply cors headers
	// if(event.request.method === 'OPTIONS'){
	// 	return new Response(null, {
	// 		headers: {
	// 			'Access-Control-Allow-Origin': '*',
	// 			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	// 			'Access-Control-Allow-Headers': 'Content-Type, Authorization',

	// 		}
	// 	})
	// }

	//authenticate user then set user in event.locals.user
	// const token = event.request.headers.get('Authorization')?.split(' ')[1]; // Bearer <token>
	if (token) {
		try {
			event.locals.user = jwt.verify(token, SECRET_KEY);
			console.log('Verified token', event.locals.user);
		} catch (e) {
			//@ts-ignore
			console.log(e.message);
		}
	}
	if (
		(event.request.method === 'PUT' || event.request.method === 'POST') &&
		contentType &&
		contentType.includes('multipart/form-data')
	) {
		const formData = await event.request.formData();
		event.locals.formData = formData;
	} else {
		console.log('Error: No form data');
	}

	// if (origin === 'http://localhost:5173') {
	// 	const response = await resolve(event);
	// 	return response;
	//   }

	//get the form data from the request and set it in event.locals.data
	// if(event.request.method === 'POST'){
	// 	//check if there is form data if not just proceed
	// 	const contentType = event.request.headers.get('content-type');
	// 	if(contentType && contentType.includes('multipart/form-data')){
	// 		const formData = await event.request.formData();
	// 		event.locals.data = formData;
	// 	}
	// }

	const response = await resolve(event);
	response.headers.append('Access-Control-Allow-Origin', '*');
	response.headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	// Bypass SvelteKit's CSRF protection for this specific origin

	return response;
};
