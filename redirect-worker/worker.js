export default {
  async fetch(request, env, ctx) {
    if (!env.MEET_URL) {
      return new Response("Error: MEET_URL environment variable is missing.", { status: 500 });
    }

    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();

    // List of known social media link preview scrapers & bots
    const isBot = /whatsapp|telegrambot|facebookexternalhit|twitterbot|discordbot|slackbot|linkedinbot|embedly|outbrain|pinterest|vkshare/i.test(userAgent);

    const title = env.META_TITLE || "Yahya's Meeting Room";
    const description = env.META_DESCRIPTION || "Join Yahya's live meeting room directly!";
    const image = env.META_IMAGE || "https://yahya.click/favicon.svg";

    if (isBot) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="icon" type="image/svg+xml" href="${image}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${request.url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
</head>
<body>
  <p>Redirecting to ${env.MEET_URL}...</p>
</body>
</html>`;

      return new Response(html, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    // For real human visitors, instant 302 redirect directly at Cloudflare Edge!
    return Response.redirect(env.MEET_URL, 302);
  },
};
