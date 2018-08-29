import React, { Component } from 'react';
import { Editor as SlateEditor } from 'slate-react';
import { Value } from 'slate';
import { Button } from '../button';
import { Toolbar } from '../toolbar';
import { isKeyHotkey } from 'is-hotkey';

import './style.css';

const DEFAULT_NODE = 'paragraph';

const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

const emptyDoc = {
	document: {
		nodes: [
			{
				object: 'block',
				type: 'paragraph',
				nodes: [
					{
						object: 'text',
						leaves: [
							{
								text: "",
							}
						],
					},
				],
			},
		],
	},
};

export default class Editor extends Component {

	constructor(props) {
		super(props);

		const existingValue = JSON.parse(localStorage.getItem('content'));
		const value = Value.fromJSON(existingValue || emptyDoc);

		this.state = { value, hasChange: false};
	}

	hasMark = type => {
		const { value } = this.state;
		return value.activeMarks.some(mark => mark.type === type);
	}

	hasBlock = type => {
		const { value } = this.state;
		return value.blocks.some(node => node.type === type);
	}

	renderMarkButton = (type, icon) => {
		const isActive = this.hasMark(type);

		return (
			<Button
				active={isActive}
				onClick={event => this.onClickMark(event, type)}
				icon={icon}
			/>
		);
	}

	renderBlockButton = (type, icon) => {
		let isActive = this.hasBlock(type);

		if (['numbered-list', 'bulleted-list'].includes(type)) {
			const { value } = this.state;
			const parent = value.document.getParent(value.blocks.first().key);
			isActive = this.hasBlock('list-item') && parent && parent.type === type;
		}

		return (
			<Button
				active={isActive}
				onClick={event => this.onClickBlock(event, type)}
				icon={icon}
			/>
		);
	}

	renderActionButton = (type, icon) => {
		return (
			<Button
				right
				active={this.state.hasChange}
				onClick={event => this.onClickAction(event, type)}
				icon={icon}
			/>
		);
	}

	renderNode = props => {
		const { attributes, children, node } = props;

		switch (node.type) {
			case 'block-quote':
				return <blockquote {...attributes}>{children}</blockquote>;
			case 'bulleted-list':
				return <ul {...attributes}>{children}</ul>;
			case 'heading-one':
				return <h1 {...attributes}>{children}</h1>;
			case 'heading-two':
				return <h2 {...attributes}>{children}</h2>;
			case 'list-item':
				return <li {...attributes}>{children}</li>;
			case 'numbered-list':
				return <ol {...attributes}>{children}</ol>;
			default:
				return null;
		}
	}

	renderMark = props => {
		const { children, mark, attributes } = props;

		switch (mark.type) {
			case 'bold':
				return <strong {...attributes}>{children}</strong>;
			case 'code':
				return <code {...attributes}>{children}</code>;
			case 'italic':
				return <em {...attributes}>{children}</em>;
			case 'underlined':
				return <u {...attributes}>{children}</u>;
			default:
				return null
		}
	}

	onChange = ({ value }) => {
		let hasChange = false;
		if (value.document !== this.state.value.document) {
			hasChange = true;
		}
		
		this.setState({ value, hasChange: hasChange });
	}

	onKeyDown = (event, change) => {
		let mark;

		if (isBoldHotkey(event)) {
			mark = 'bold';
		} else if (isItalicHotkey(event)) {
			mark = 'italic';
		} else if (isUnderlinedHotkey(event)) {
			mark = 'underlined';
		} else if (isCodeHotkey(event)) {
			mark = 'code';
		} else {
			return;
		}

		event.preventDefault();
		change.toggleMark(mark);
		return true;
	}

	onClickMark = (event, type) => {
		event.preventDefault();
		const { value } = this.state;
		const change = value.change().toggleMark(type);
		this.onChange(change);
	}

	onClickBlock = (event, type) => {
		event.preventDefault();
		const { value } = this.state;
		const change = value.change();
		const { document } = value;

		// Handle everything but list buttons.
		if (type !== 'bulleted-list' && type !== 'numbered-list') {
			const isActive = this.hasBlock(type);
			const isList = this.hasBlock('list-item');

			if (isList) {
				change
					.setBlocks(isActive ? DEFAULT_NODE : type)
					.unwrapBlock('bulleted-list')
					.unwrapBlock('numbered-list');
			} else {
				change.setBlocks(isActive ? DEFAULT_NODE : type);
			}
		} else {
			// Handle the extra wrapping required for list buttons.
			const isList = this.hasBlock('list-item');
			const isType = value.blocks.some(block => {
				return !!document.getClosest(block.key, parent => parent.type === type);
			});

			if (isList && isType) {
				change
					.setBlocks(DEFAULT_NODE)
					.unwrapBlock('bulleted-list')
					.unwrapBlock('numbered-list');
			} else if (isList) {
				change
					.unwrapBlock(
						type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
					)
					.wrapBlock(type);
			} else {
				change.setBlocks('list-item').wrapBlock(type);
			}
		}

		this.onChange(change);
	}

	onClickAction = (event, type) => {
		event.preventDefault();

		if (type === 'save') {
			const value = this.state.value;
			const content = JSON.stringify(value.toJSON());
			localStorage.setItem('content', content);
			this.setState({ hasChange: false });
		}

		if (type === 'restore') {
			const existingValue = JSON.parse(localStorage.getItem('content'));
			const value = Value.fromJSON(existingValue || emptyDoc );
			
			this.setState({ value, hasChange: false });
		}
	}

	render() {
		return (
			<div className="simple-slate">
				<Toolbar>
					{this.renderMarkButton('bold', 'format_bold')}
					{this.renderMarkButton('italic', 'format_italic')}
					{this.renderMarkButton('underlined', 'format_underlined')}
					{this.renderMarkButton('code', 'code')}
					{this.renderBlockButton('heading-one', 'looks_one')}
					{this.renderBlockButton('heading-two', 'looks_two')}
					{this.renderBlockButton('block-quote', 'format_quote')}
					{this.renderBlockButton('numbered-list', 'format_list_numbered')}
					{this.renderBlockButton('bulleted-list', 'format_list_bulleted')}
					{this.renderActionButton('restore', 'clear')}
					{this.renderActionButton('save', 'save')}
				</Toolbar>
				<SlateEditor
					spellCheck
					autoFocus
					placeholder="Enter some rich text..."
					value={this.state.value}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					renderNode={this.renderNode}
					renderMark={this.renderMark}
				/>
			</div>
		);
	}
}