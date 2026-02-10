# Jive — i18n translation and proofreading for JSON localization files

Translate, revise, and proofread your localization files and websites using LLMs. Jive works with flat JSON message files (like those used by react-intl) and can also analyze live websites for grammar, wording, and phrasing issues.

**[Try it in your browser](https://jive-eosin.vercel.app/)**

## What it does

- **Translate** JSON localization files into 13 languages
- **Revise** existing translations to catch grammar mistakes, awkward wording, and weak phrasing
- **Advise** on live websites by analyzing their text content directly

Works with Google Gemini, OpenAI, and Anthropic.

## Packages

This is a monorepo with three packages:

| Package | Description |
|---|---|
| [`@jive/core`](packages/core) | Translation and revision engine |
| [`jive` CLI](apps/cli) | Interactive command-line tool |
| [`@jive/web`](apps/web) | Web app and API |

## Quick start

### CLI

```
npm install --global jive
```

```
$ jive translate en.json --language de

? Select a provider: Gemini
? Enter your API key: ****
? Select a model: gemini-2.0-flash
? Product context (optional): An e-commerce checkout flow

  Translating to German...
  ████████████████████████████████ 100% (142/142 messages)

  Wrote de.json
```

```
$ jive revise en.json

? Select a provider: Gemini
? Enter your API key: ****
? Select error types: Grammar/Spelling, Bad Wording, Non-ideal Phrasing

  Analyzing...

  Found 3 suggestions:

  checkout.title
  ─ Original:  "Checkout you're order"
  ─ Suggested: "Checkout your order"
  ─ Reason:    "you're" should be "your" (possessive)

  Accept this suggestion? (y/n)
```

```
$ jive advise https://example.com

  Analyzing website...

  Found 5 suggestions:

  hero.headline
  ─ Original:  "We helps you build better products"
  ─ Suggested: "We help you build better products"
  ─ Type:      grammar
```

### Web app

```
git clone <repo-url> && cd jive
pnpm install
echo "GOOGLE_API_KEY=your-key" > apps/web/.env
pnpm dev
```

Open http://localhost:5173, enter a URL, and get results streamed back in real time.

## Supported languages

German, French, Spanish, Italian, Portuguese, Dutch, Polish, Japanese, Chinese (Simplified), Korean, Russian, Turkish, Arabic.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)
