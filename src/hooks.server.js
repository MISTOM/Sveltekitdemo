import { SECRET_KEY } from '$env/static/private';
import jwt from 'jsonwebtoken';


/**
 *
 * @type import('@sveltejs/kit').Handle
 */
export const handle = async ({ event, resolve }) => {
	//authenticate user then set user in event.locals.user
	const token = event.request.headers.get("Authorization")?.split(" ")[1]; // Bearer <token>
	if (token) {
		try {
			const decoded = jwt.verify(token, SECRET_KEY);
			event.locals.user = decoded;
			console.log("Verified token",decoded);
		} catch (e) {
			console.log("Token Error",e);
		}
	}

	// if (event.url.pathname.startsWith('/protected')) {
	// 	if (!event.locals.user) {
	// 		return json({ error: 'not authenticated' }, { status: 401 });
	// 	}
	// }
	
	// Bypass SvelteKit's CSRF protection for this specific origin during development
	// if (event.request.headers.get('origin') === 'http://localhost:5173' && process.env.NODE_ENV === 'development') {
	// 	const response = await resolve(event);
	// 	return response;
	//   }



	return resolve(event);
};
