import {adviseWebsite, type RevisionErrorType} from '@jive/core';

export async function POST(request: Request) {
	const apiKey = process.env['GOOGLE_API_KEY'];
	if (!apiKey) {
		return Response.json({error: 'GOOGLE_API_KEY is not configured'}, {status: 500});
	}

	let body: {url: string; errorTypes?: RevisionErrorType[]};
	try {
		body = await request.json() as typeof body;
	} catch {
		return Response.json({error: 'Invalid JSON body'}, {status: 400});
	}

	let url = body.url.trim();
	if (!url.match(/^https?:\/\//)) {
		url = `https://${url}`;
	}

	try {
		new URL(url);
	} catch {
		return Response.json({error: 'Invalid URL provided'}, {status: 400});
	}

	try {
		const suggestions = await adviseWebsite({
			websiteUrl: url,
			errorTypes: ['grammar', 'wording', 'phrasing'],
			apiKey,
			model: 'gemini-3-flash-preview',
		});

		return Response.json({suggestions});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return Response.json({error: message}, {status: 500});
	}
}
