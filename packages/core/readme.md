# @jive/core

The shared engine behind Jive. Handles translation, revision, and website analysis by talking to LLM APIs and returning structured results.

## API

### `translateMessages(options)`

Translates a flat JSON message object into a target language. Processes messages in batches of 100. Returns the translated messages as a key-value object.

```ts
import {translateMessages} from '@jive/core';

const result = await translateMessages({
  messages: {'greeting': 'Hello', 'farewell': 'Goodbye'},
  language: 'de',
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKey: '...',
});
// result: { greeting: 'Hallo', farewell: 'Auf Wiedersehen' }
```

### `reviseMessages(options)`

Finds grammar, wording, and phrasing issues in a message object. Returns an array of suggestions, each with the original text, a suggested fix, and a reason.

```ts
import {reviseMessages} from '@jive/core';

const suggestions = await reviseMessages({
  messages: {'title': "Checkout you're order"},
  errorTypes: ['grammar', 'wording', 'phrasing'],
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  apiKey: '...',
});
```

### `adviseWebsite(url)` / `adviseWebsiteStream(url)`

Analyzes a live website for text issues. The streaming variant yields suggestions one at a time as they arrive.

```ts
import {adviseWebsiteStream} from '@jive/core';

for await (const suggestion of adviseWebsiteStream({
  websiteUrl: 'https://example.com',
  errorTypes: ['grammar', 'wording', 'phrasing'],
  apiKey: '...',
  model: 'gemini-2.5-flash',
})) {
  console.log(suggestion);
}
```

## Providers

- **Google Gemini** - `gemini-2.0-flash`, `gemini-2.5-flash`, etc.
- **OpenAI** - `gpt-4o`, `gpt-4o-mini`, etc.
- **Anthropic** - `claude-sonnet-4-5-20250929`, etc.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)
