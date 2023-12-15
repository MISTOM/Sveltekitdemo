/** @type {import('./$types').RequestHandler} */
export async function GET() {
    const res = "you have reached this server hooray!!"
    return new Response(res);
};