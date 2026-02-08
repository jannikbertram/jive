export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const analyzedUrl = requestUrl.searchParams.get('url');

	if (!analyzedUrl) {
		return Response.json({urls: []});
	}

	let origin: string;
	try {
		origin = new URL(analyzedUrl).origin;
	} catch {
		return Response.json({urls: []});
	}

	try {
		const urls = await fetchSitemapUrls(`${origin}/sitemap.xml`, analyzedUrl);
		return Response.json({urls});
	} catch {
		return Response.json({urls: []});
	}
}

async function fetchSitemapUrls(sitemapUrl: string, excludeUrl: string, depth = 0): Promise<string[]> {
	const response = await fetch(sitemapUrl, {signal: AbortSignal.timeout(5000)});
	if (!response.ok) return [];

	const text = await response.text();

	if (text.includes('<sitemapindex') && depth < 1) {
		const subSitemapUrls = extractLocs(text).slice(0, 5);
		const results = await Promise.all(
			subSitemapUrls.map(url => fetchSitemapUrls(url, excludeUrl, depth + 1)),
		);
		return dedup(results.flat(), excludeUrl);
	}

	return dedup(extractLocs(text), excludeUrl);
}

function extractLocs(xml: string): string[] {
	const re = /<loc>\s*(.*?)\s*<\/loc>/g;
	return Array.from(xml.matchAll(re), match => match[1]!);
}

function dedup(urls: string[], excludeUrl: string): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	const normalizedExclude = excludeUrl.replace(/\/+$/, '');

	for (const url of urls) {
		const normalized = url.replace(/\/+$/, '');
		if (normalized === normalizedExclude || seen.has(normalized)) continue;
		seen.add(normalized);
		result.push(url);
		if (result.length >= 50) break;
	}

	return result;
}
