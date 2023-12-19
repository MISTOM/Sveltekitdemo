// import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
// import {createServerClient } from '@supabase/ssr'

/**
 *
 * @type import('@sveltejs/kit').Handle
 */
export const handle = async ({ event, resolve }) => {
	return resolve(event);
};
