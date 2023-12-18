import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import {createServerClient } from '@supabase/ssr'

/**
 * 
 * @type import('@sveltejs/kit').Handle
 */
export const handle = async ({ event, resolve}) => {
    // console.log(`PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY}`, `PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL}`)

    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            get: (key) => event.cookies.get(key),
            set: (key, value, options) => { 
                options = { path: '/api', ...options };
                event.cookies.set(key, value, options);
                },
            remove: (key, options) => { 
                options = { path: '/api', ...options };
                event.cookies.delete(key, options);
                }
            
        }
    })


    event.locals.getSession = async () =>{
        const {data, error} = await event.locals.supabase.auth.getSession()
        if (error) {console.log(error); return null }
        return data.session
    }

    
    return resolve(event, {
        filterSerializedResponseHeaders(name) {
          return name === 'content-range'
        },
      })
}