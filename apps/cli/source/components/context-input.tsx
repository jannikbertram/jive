import React, {useState} from 'react';
import {Box, Text} from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';

type Props = {
	readonly onSubmit: (context: string) => void;
};

type InputMode = 'select' | 'file' | 'direct';

const options = [
	{label: '⏭️  Skip (no context)', value: 'skip'},
	{label: '📄 Enter path to a file (e.g., ./readme.md)', value: 'file'},
	{label: '✏️  Enter context', value: 'direct'},
];

/**
 * Interactive input for providing product context via file path or direct text.
 */
export function ContextInput({onSubmit}: Props) {
	const [mode, setMode] = useState<InputMode>('select');
	const [value, setValue] = useState('');

	const handleModeSelect = (item: {label: string; value: string}) => {
		if (item.value === 'skip') {
			onSubmit('');
		} else {
			setMode(item.value as InputMode);
		}
	};

	const handleSubmit = (submittedValue: string) => {
		onSubmit(submittedValue.trim());
	};

	if (mode === 'select') {
		return (
			<Box flexDirection='column'>
				<Text bold>Product context (optional):</Text>
				<Text dimColor>
					Provide context about your product to improve translation quality.
				</Text>
				<Box marginTop={1}>
					<SelectInput items={options} onSelect={handleModeSelect} />
				</Box>
			</Box>
		);
	}

	if (mode === 'file') {
		return (
			<Box flexDirection='column'>
				<Text bold>Enter path to context file:</Text>
				<Box marginTop={1}>
					<Text>Path: </Text>
					<TextInput
						placeholder='./README.md'
						value={value}
						onChange={setValue}
						onSubmit={handleSubmit}
					/>
				</Box>
			</Box>
		);
	}

	// mode === 'direct'
	return (
		<Box flexDirection='column'>
			<Text bold>Enter context directly:</Text>
			<Text dimColor>
				Describe your product, target audience, tone, or domain-specific terms.
			</Text>
			<Box marginTop={1}>
				<Text>Context: </Text>
				<TextInput
					placeholder='A friendly mobile app for...'
					value={value}
					onChange={setValue}
					onSubmit={handleSubmit}
				/>
			</Box>
		</Box>
	);
}
