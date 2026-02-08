import {adviseWebsite, type RevisionErrorType} from '@rire/core';

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

	if (!body.url || typeof body.url !== 'string') {
		return Response.json({error: 'Missing required field: url'}, {status: 400});
	}

	try {
		const suggestions = await adviseWebsite({
			websiteUrl: body.url,
			errorTypes: ['grammar', 'wording', 'phrasing'],
			apiKey,
			model: 'gemini-2.5-flash',
		});

		return Response.json({suggestions});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return Response.json({error: message}, {status: 500});
	}
}
