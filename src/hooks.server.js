import { SECRET_KEY } from '$env/static/private';
import jwt from 'jsonwebtoken';

/**
 * @type import('@sveltejs/kit').Handle
 */
export const handle = async ({ event, resolve }) => {
	const ALLOWED_ORIGINS = ['http://localhost:5174'];
	const origin = event.request.headers.get('origin');

	console.log(origin);

	//Turned off csrf protection so I only need to check if origin is allowed

	if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
		return new Response('Forbidden', { status: 403 });
	}

	console.log('origin', origin);

	// Apply cors headers
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization'
			}
		});
	}

	//authenticate user then set user in event.locals.user
	const token = event.request.headers.get('Authorization')?.split(' ')[1]; // Bearer <token>
	if (token) {
		try {
			event.locals.user = jwt.verify(token, SECRET_KEY);
			console.log('Verified token', event.locals.user);
		} catch (e) {
			//@ts-ignore
			console.log(e.message);
		}
	}
	event.locals.session = {};

	const contentType = event.request.headers.get('content-type');
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

	const response = await resolve(event);
	response.headers.append('Access-Control-Allow-Origin', '*');
	response.headers.append('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	response.headers.append('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	return response;
};
