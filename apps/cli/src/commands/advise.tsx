import fs from 'node:fs';
import process from 'node:process';
import React, {useState} from 'react';
import {Box, Text} from 'ink';
import {
	adviseLabels,
	type Provider,
	type RevisionErrorType,
	type RevisionSuggestion,
} from '@rire/core';
import {z} from 'zod/v4';
import Spinner from 'ink-spinner';
import {CheerioCrawler, type CheerioAPI} from 'crawlee';
import {AdviseReview} from '../components/advise-review.js';
import {ApiKeyInput} from '../components/api-key-input.js';
import {ErrorTypeSelector} from '../components/error-type-selector.js';
import {LlmSelector} from '../components/llm-selector.js';
import {ModelSelector} from '../components/model-selector.js';

export const args = z.tuple([
	z.string().describe('URL of the website to advise'),
]);

export const options = z.object({
	provider: z.enum(['gemini', 'openai', 'anthropic']).optional().describe('LLM provider to use'),
	model: z.string().optional().describe('Model to use for analysis'),
	'api-key': z.string().optional().describe('API key for the provider'),
	'error-types': z.string().optional().describe('Comma-separated error types: grammar,wording,phrasing'),
});

type Props = {
	readonly args: z.infer<typeof args>;
	readonly options: z.infer<typeof options>;
};

type Step =
	| 'provider'
	| 'model'
	| 'apiKey'
	| 'errorTypes'
	| 'crawling'
	| 'analyzing'
	| 'review'
	| 'done';

const apiKeyEnvVars: Record<Provider, string> = {
	gemini: 'GOOGLE_API_KEY',
	openai: 'OPENAI_API_KEY',
	anthropic: 'ANTHROPIC_API_KEY',
};

function getApiKeyFromEnv(provider: Provider): string | undefined {
	return process.env[apiKeyEnvVars[provider]];
}

function parseErrorTypes(errorTypesOption: string | undefined): RevisionErrorType[] | undefined {
	if (!errorTypesOption) {
		return undefined;
	}

	const validTypes = new Set<RevisionErrorType>(['grammar', 'wording', 'phrasing']);
	const parsed = errorTypesOption.split(',').map(s => s.trim().toLowerCase());
	const filtered = parsed.filter((t): t is RevisionErrorType => validTypes.has(t as RevisionErrorType));
	return filtered.length > 0 ? filtered : undefined;
}

/**
 * Returns true if the text is predominantly Latin-script (English-like).
 * Filters out labels in other languages/scripts.
 */
function isLikelyEnglish(text: string): boolean {
	const latinChars = text.replace(/[\s\d\p{P}\p{S}]/gu, '');
	if (latinChars.length === 0) {
		return false;
	}

	const latinMatches = latinChars.match(/[\p{Script=Latin}]/gu);
	return (latinMatches?.length ?? 0) / latinChars.length > 0.8;
}

/**
 * Returns true if the label looks like meaningful UI text worth analyzing.
 */
function isRelevantLabel(text: string): boolean {
	// Too short or too long to be a UI label
	if (text.length < 2 || text.length > 300) {
		return false;
	}

	// Pure numbers, URLs, emails, or file paths
	if (/^[\d\s.,/%:-]+$/.test(text)) {
		return false;
	}

	if (/^https?:\/\//.test(text) || /^[\w.-]+@[\w.-]+\.\w+$/.test(text)) {
		return false;
	}

	// Copyright/legal boilerplate
	if (/^[©®™]/.test(text) || /^\d{4}\s/.test(text)) {
		return false;
	}

	return isLikelyEnglish(text);
}

/**
 * Extracts visible UI labels from a page using Cheerio.
 * Focuses on actionable elements a screen reader would announce.
 */
function extractLabels($: CheerioAPI, pagePath: string): Record<string, string> {
	const labels: Record<string, string> = {};
	const seen = new Set<string>();
	const counters: Record<string, number> = {};

	const addLabel = (elementType: string, text: string) => {
		const trimmed = text.trim().replace(/\s+/g, ' ');
		if (!isRelevantLabel(trimmed)) {
			return;
		}

		// Deduplicate by text content
		if (seen.has(trimmed)) {
			return;
		}

		seen.add(trimmed);
		counters[elementType] = (counters[elementType] ?? 0) + 1;
		const key = `${pagePath}#${elementType}-${counters[elementType]}`;
		labels[key] = trimmed;
	};

	// Skip hidden elements
	const isVisible = (_: number, el: Parameters<typeof $>[0]) =>
		!$(el as never).closest('[aria-hidden="true"], [hidden], [style*="display:none"], [style*="display: none"]').length;

	// Headings
	$('h1, h2, h3, h4, h5, h6').filter(isVisible).each((_, el) => {
		addLabel(el.tagName.toLowerCase(), $(el).text());
	});

	// Buttons
	$('button, [role="button"]').filter(isVisible).each((_, el) => {
		const text = $(el).text() || $(el).attr('aria-label') || '';
		addLabel('button', text);
	});

	// Links
	$('a').filter(isVisible).each((_, el) => {
		const text = $(el).text() || $(el).attr('aria-label') || '';
		addLabel('link', text);
	});

	// Form labels
	$('label').filter(isVisible).each((_, el) => {
		addLabel('label', $(el).text());
	});

	// Input placeholders
	$('input[placeholder], textarea[placeholder]').each((_, el) => {
		const placeholder = $(el).attr('placeholder') ?? '';
		addLabel('placeholder', placeholder);
	});

	// Navigation items
	$('nav a, nav button').filter(isVisible).each((_, el) => {
		const text = $(el).text() || $(el).attr('aria-label') || '';
		addLabel('nav', text);
	});

	// Table headers
	$('th').filter(isVisible).each((_, el) => {
		addLabel('th', $(el).text());
	});

	// Image alt text
	$('img[alt]').each((_, el) => {
		const alt = $(el).attr('alt') ?? '';
		addLabel('alt', alt);
	});

	// Title
	const title = $('title').text();
	if (title) {
		addLabel('title', title);
	}

	// Meta description
	const metaDesc = $('meta[name="description"]').attr('content');
	if (metaDesc) {
		addLabel('meta-description', metaDesc);
	}

	return labels;
}

/**
 * Normalizes a URL to ensure it has a protocol.
 */
function normalizeUrl(url: string): string {
	if (!/^https?:\/\//i.test(url)) {
		return `https://${url}`;
	}

	return url;
}

/**
 * Generates a markdown report from the suggestions.
 */
function generateMarkdownReport(
	websiteUrl: string,
	suggestions: RevisionSuggestion[],
): string {
	const lines: string[] = [
		`# Suggestions for ${websiteUrl}`,
		'',
	];

	for (const s of suggestions) {
		lines.push(`## ${s.key}`);
		lines.push('');
		lines.push(`**Type:** ${s.type}`);
		lines.push('');
		lines.push(`**Original:** ${s.original}`);
		lines.push('');
		lines.push(`**Suggested:** ${s.suggested}`);
		lines.push('');
		lines.push(`**Reason:** ${s.reason}`);
		lines.push('');
		lines.push('---');
		lines.push('');
	}

	return lines.join('\n');
}

export default function Advise({args: commandArgs, options: commandOptions}: Props) {
	const [url] = commandArgs;
	const websiteUrl = normalizeUrl(url);

	const initialProvider = commandOptions.provider;
	const initialApiKey = commandOptions['api-key'] ?? (initialProvider ? getApiKeyFromEnv(initialProvider) : undefined);
	const initialModel = commandOptions.model;
	const initialErrorTypes = parseErrorTypes(commandOptions['error-types']);

	const getInitialStep = (): Step => {
		if (!initialProvider) {
			return 'provider';
		}

		if (!initialApiKey) {
			return 'apiKey';
		}

		if (!initialModel) {
			return 'model';
		}

		if (!initialErrorTypes) {
			return 'errorTypes';
		}

		return 'crawling';
	};

	const [step, setStep] = useState<Step>(getInitialStep);
	const [provider, setProvider] = useState<Provider | undefined>(initialProvider);
	const [model, setModel] = useState<string>(initialModel ?? 'gemini-2.5-flash');
	const [apiKey, setApiKey] = useState<string>(initialApiKey ?? '');
	const [errorTypes, setErrorTypes] = useState<RevisionErrorType[]>(initialErrorTypes ?? ['grammar']);
	const [error, setError] = useState<string>('');
	const [crawlProgress, setCrawlProgress] = useState({pagesProcessed: 0, labelsFound: 0});
	const [analyzeProgress, setAnalyzeProgress] = useState({current: 0, total: 0});
	const [suggestions, setSuggestions] = useState<RevisionSuggestion[]>([]);
	const [savedPath, setSavedPath] = useState<string>('');
	const [hasStartedCrawl, setHasStartedCrawl] = useState(false);

	const startCrawl = () => {
		setStep('crawling');
		setHasStartedCrawl(true);

		void (async () => {
			try {
				let allLabels: Record<string, string> = {};

				const crawler = new CheerioCrawler({
					maxRequestsPerCrawl: 1,
					async requestHandler({request, $}) {
						const pagePath = new URL(request.url).pathname;
						allLabels = extractLabels($, pagePath);

						setCrawlProgress({
							pagesProcessed: 1,
							labelsFound: Object.keys(allLabels).length,
						});
					},
				});

				await crawler.run([websiteUrl]);

				if (Object.keys(allLabels).length === 0) {
					setError('No labels found on the website.');
					setStep('done');
					return;
				}

				setStep('analyzing');

				const result = await adviseLabels({
					labels: allLabels,
					errorTypes,
					websiteUrl,
					apiKey,
					provider: provider!,
					model,
					onProgress(current: number, total: number) {
						setAnalyzeProgress({current, total});
					},
				});

				setSuggestions(result);

				if (result.length === 0) {
					setStep('done');
				} else {
					setStep('review');
				}
			} catch (error_) {
				setError(error_ instanceof Error ? error_.message : 'Unknown error');
				setStep('done');
			}
		})();
	};

	const handleSave = (filePath: string) => {
		try {
			const report = generateMarkdownReport(websiteUrl, suggestions);
			fs.writeFileSync(filePath, report);
			setSavedPath(filePath);
		} catch (error_) {
			setError(error_ instanceof Error ? error_.message : 'Failed to write file');
		}

		setStep('done');
	};

	const handleQuit = () => {
		setStep('done');
	};

	// Auto-start crawl when all CLI options are provided
	if (step === 'crawling' && !hasStartedCrawl) {
		startCrawl();
	}

	const handleProviderSelect = (selectedProvider: Provider) => {
		setProvider(selectedProvider);
		const envApiKey = getApiKeyFromEnv(selectedProvider);
		if (envApiKey) {
			setApiKey(envApiKey);
			setStep('model');
		} else {
			setStep('apiKey');
		}
	};

	const handleApiKeySubmit = (key: string) => {
		setApiKey(key);
		setStep('model');
	};

	const handleModelSelect = (selectedModel: string) => {
		setModel(selectedModel);
		setStep('errorTypes');
	};

	const handleErrorTypesSubmit = (types: RevisionErrorType[]) => {
		setErrorTypes(types);
		startCrawl();
	};

	return (
		<Box flexDirection='column' padding={1}>
			<Box marginBottom={1}>
				<Text bold color='cyan'>
					🔍 Rire Adviser
				</Text>
			</Box>

			<Box marginBottom={1}>
				<Text dimColor>Website: {websiteUrl}</Text>
			</Box>

			{step === 'provider' && <LlmSelector onSelect={handleProviderSelect} />}

			{step === 'apiKey' && provider && (
				<ApiKeyInput provider={provider} onSubmit={handleApiKeySubmit} />
			)}

			{step === 'model' && provider && (
				<ModelSelector provider={provider} onSelect={handleModelSelect} />
			)}

			{step === 'errorTypes' && (
				<ErrorTypeSelector onSubmit={handleErrorTypesSubmit} />
			)}

			{step === 'crawling' && (
				<Box flexDirection='column'>
					<Box>
						<Text color='cyan'>
							<Spinner type='dots' />
						</Text>
						<Text> Crawling website...</Text>
					</Box>
					<Box marginTop={1} flexDirection='column'>
						<Text>Labels found: {crawlProgress.labelsFound}</Text>
					</Box>
				</Box>
			)}

			{step === 'analyzing' && (
				<Box flexDirection='column'>
					<Box>
						<Text color='cyan'>
							<Spinner type='dots' />
						</Text>
						<Text> Analyzing labels for issues...</Text>
					</Box>
					{analyzeProgress.total > 0 && (
						<Box marginTop={1}>
							<Text>
								Progress: {analyzeProgress.current}/{analyzeProgress.total} ({Math.round((analyzeProgress.current / analyzeProgress.total) * 100)}%)
							</Text>
						</Box>
					)}
				</Box>
			)}

			{step === 'review' && suggestions.length > 0 && (
				<AdviseReview
					suggestions={suggestions}
					onQuit={handleQuit}
					onSave={handleSave}
				/>
			)}

			{step === 'done' && (
				<Box flexDirection='column'>
					{error
						? (
							<Text color='red'>Error: {error}</Text>
						)
						: (
							<>
								<Text color='green'>✓ Analysis complete!</Text>
								<Text>Found {suggestions.length} suggestions</Text>
								{savedPath && (
									<Text>Saved to {savedPath}</Text>
								)}
							</>
						)}
				</Box>
			)}
		</Box>
	);
}
