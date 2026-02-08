# Jive CLI

An interactive command-line tool for translating and proofreading localization files. Walks you through provider selection, API key entry, and model choice, then processes your files and lets you review suggestions one by one.

## Install

```
npm install --global jive
```

## Commands

### `jive translate <file>`

Translates a JSON localization file into a target language.

```
jive translate en.json --language de --provider gemini --model gemini-2.0-flash
```

Options:
- `--language` - Target language code (de, fr, es, it, pt, nl, pl, ja, zh, ko, ru, tr, ar)
- `--provider` - LLM provider (gemini, openai, anthropic)
- `--model` - Model name
- `--api-key` - API key (or set via environment variable)
- `--output` - Output file path (defaults to `{language}.json` in the source directory)
- `--context` - Product context to improve translation quality
- `--context-path` - Path to a file containing context (e.g., a README)

### `jive revise <file>`

Finds grammar, wording, and phrasing issues in a localization file. Presents suggestions interactively so you can accept or reject each one.

```
jive revise en.json --provider gemini --error-types grammar,wording
```

Options:
- `--provider` - LLM provider (gemini, openai, anthropic)
- `--model` - Model name
- `--api-key` - API key
- `--error-types` - Comma-separated: grammar, wording, phrasing
- `--accept-all` - Skip the review step and accept everything
- `--context` / `--context-path` - Product context

### `jive advise <url>`

Analyzes a live website for text issues using Google Gemini.

```
jive advise https://example.com
```

Options:
- `--api-key` - Google API key
- `--model` - Gemini model
- `--error-types` - Comma-separated: grammar, wording, phrasing

## Environment variables

API keys can be set as environment variables so you don't have to enter them each time:

- `GOOGLE_API_KEY` - for Gemini
- `OPENAI_API_KEY` - for OpenAI
- `ANTHROPIC_API_KEY` - for Anthropic

Jive loads `.env` files automatically.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)
