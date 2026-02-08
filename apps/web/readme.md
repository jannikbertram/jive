# Jive Web

A web interface for analyzing websites for grammar, wording, and phrasing issues. Enter a URL, get suggestions streamed back in real time. After analysis, Jive discovers other pages via the site's sitemap so you can analyze them with one click.

**[Live app](https://jive-eosin.vercel.app/)**

## Running locally

```
pnpm install
echo "GOOGLE_API_KEY=your-key" > .env
pnpm dev
```

Open http://localhost:5173.

## How it works

The frontend sends the URL to `/api/advise`, which uses `@jive/core` to stream suggestions back as newline-delimited JSON. Once results appear, the app fetches `/api/sitemap` to discover other pages on the same domain.

### API routes

**`POST /api/advise`** - Analyze a website. Request body: `{"url": "..."}`. Returns streaming NDJSON, one suggestion per line.

**`GET /api/sitemap?url=...`** - Fetch and parse the site's `sitemap.xml`. Returns `{"urls": [...]}` with up to 50 page URLs.

## Deployment

Deployed on Vercel. API routes run as serverless functions. Requires `GOOGLE_API_KEY` set in the Vercel environment.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)
