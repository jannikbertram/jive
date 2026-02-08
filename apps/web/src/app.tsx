import {type FormEvent, useState} from 'react';
import './app.css';

type RevisionSuggestion = {
	key: string;
	original: string;
	suggested: string;
	reason: string;
	type: 'grammar' | 'wording' | 'phrasing';
};

export function App() {
	const [url, setUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<RevisionSuggestion[] | undefined>();
	const [error, setError] = useState<string | undefined>();

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		setLoading(true);
		setError(undefined);
		setSuggestions(undefined);

		try {
			const response = await fetch('/api/advise', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({url}),
			});

			const data = await response.json() as {suggestions?: RevisionSuggestion[]; error?: string};

			if (!response.ok) {
				setError(data.error ?? 'Request failed');
				return;
			}

			setSuggestions(data.suggestions ?? []);
		} catch {
			setError('Failed to connect to the server');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="container">
			<h1>Rire</h1>
			<p className="subtitle">Analyze a website for grammar, wording, and phrasing issues.</p>

			<form onSubmit={handleSubmit}>
				<div className="input-row">
					<input
						type="url"
						value={url}
						onChange={e => {
							setUrl(e.target.value);
						}}
						placeholder="https://example.com"
						required
						disabled={loading}
					/>
					<button type="submit" disabled={loading || !url}>
						{loading ? 'Analyzing…' : 'Analyze'}
					</button>
				</div>
			</form>

			{error && <div className="error">{error}</div>}

			{suggestions !== undefined && (
				suggestions.length === 0
					? <p className="no-issues">No issues found.</p>
					: (
						<table>
							<thead>
								<tr>
									<th>Key</th>
									<th>Type</th>
									<th>Original</th>
									<th>Suggested</th>
									<th>Reason</th>
								</tr>
							</thead>
							<tbody>
								{suggestions.map((s, i) => (
									<tr key={i}>
										<td><code>{s.key}</code></td>
										<td><span className={`badge badge-${s.type}`}>{s.type}</span></td>
										<td>{s.original}</td>
										<td>{s.suggested}</td>
										<td>{s.reason}</td>
									</tr>
								))}
							</tbody>
						</table>
					)
			)}
		</div>
	);
}
