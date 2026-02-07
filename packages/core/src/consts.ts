/**
 * The number of messages to translate in each batch.
 */
export const TRANSLATION_BATCH_SIZE = 100;

/**
 * Mapping of language codes to human-readable language names.
 * Used to provide better context to the AI model in translation prompts.
 */
export const LANGUAGE_NAMES: Record<string, string> = {
	de: 'German',
	fr: 'French',
	es: 'Spanish',
	it: 'Italian',
	pt: 'Portuguese',
	nl: 'Dutch',
	pl: 'Polish',
	ja: 'Japanese',
	zh: 'Chinese (Simplified)',
	ko: 'Korean',
	ru: 'Russian',
	tr: 'Turkish',
	ar: 'Arabic',
};

/**
 * Revision error types representing different severity levels of issues.
 * Used to categorize suggestions when revising localization content.
 */
export const REVISION_ERROR_TYPES = {
	grammar: {
		label: 'Grammar/Spelling',
		description: 'Grammar or spelling mistakes (critical)',
	},
	wording: {
		label: 'Bad Wording',
		description: 'Awkward or incorrect wording (medium)',
	},
	phrasing: {
		label: 'Non-ideal Phrasing',
		description: 'Phrases that could be improved (minor)',
	},
} as const;

/**
 * Valid revision error type identifiers.
 */
export type RevisionErrorType = keyof typeof REVISION_ERROR_TYPES;

/**
 * The number of messages to analyze in each revision batch.
 */
export const REVISION_BATCH_SIZE = 100;

/**
 * The number of labels to analyze in each advise batch.
 */
export const ADVISE_BATCH_SIZE = 50;
