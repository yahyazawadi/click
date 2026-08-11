export default {
  async fetch(request, env, ctx) {
    // Only get the URL from the environment variable
    if (!env.MEET_URL) {
      return new Response("Error: MEET_URL environment variable is missing.", { status: 500 });
    }
    
    return Response.redirect(env.MEET_URL, 302);
  },
};
