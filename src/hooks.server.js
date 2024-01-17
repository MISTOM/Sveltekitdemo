import { SECRET_KEY } from '$env/static/private';
import jwt from 'jsonwebtoken';

/**
 * @type import('@sveltejs/kit').Handle
 */
export const handle = async ({ event, resolve }) => {
	const ALLOWED_ORIGINS = ['http://localhost:5174', 'https://sneaker-empire-ten.vercel.app'];
	const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';
	const ALLOWED_HEADERS = 'Content-Type, Authorization';
	const origin = event.request.headers.get('origin');

	//Turned off csrf protection so I only need to check if origin is allowed
	if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
		console.log('Forbidden origin', origin);
		return new Response('Forbidden', { status: 403 });
	}

	// Apply cors headers
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': ALLOWED_METHODS,
				'Access-Control-Allow-Headers': ALLOWED_HEADERS
			}
		});
	}

	//authenticate user then set user in event.locals.user
	const token = event.request.headers.get('Authorization')?.split(' ')[1]; // Bearer <token>
	if (token) {
		try {
			event.locals.user = jwt.verify(token, SECRET_KEY);
		} catch (e) {
			//@ts-ignore
			console.log('Unverified User:', e.message);
		}
	}

	const contentType = event.request.headers.get('content-type');
	//If request is a form data, parse it and set it in event.locals.formData
	if (
		['POST', 'PUT'].includes(event.request.method) &&
		contentType &&
		contentType.includes('multipart/form-data')
	) {
		event.locals.formData = await event.request.formData();
	}

	const response = await resolve(event);
	response.headers.append('Access-Control-Allow-Origin', '*');
	response.headers.append('Access-Control-Allow-Methods', ALLOWED_METHODS);
	response.headers.append('Access-Control-Allow-Headers', ALLOWED_HEADERS);

	return response;
};
