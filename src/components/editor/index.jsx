import React, { Component } from 'react';
import { Editor as SlateEditor } from 'slate-react';
import { Block, Value } from 'slate';
import { Button } from '../button';
import { Toolbar } from '../toolbar';
import { FileInputButton } from '../file_input';
import { Image } from '../image';
import { isKeyHotkey } from 'is-hotkey';

import './style.css';

const DEFAULT_NODE = 'paragraph';

const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');
const isIndentHotkey = isKeyHotkey('tab');

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
				onMouseDown={event => this.onClickMark(event, type)}
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
				onMouseDown={event => this.onClickBlock(event, type)}
				icon={icon}
			/>
		);
	}

	renderActionButton = (type, icon) => {
		let { maxNodes } = this.props;
		let { value, hasChange } = this.state;
		let isActive = hasChange;
		const nodes = value.document.nodes.size;

		if (type === 'save'
			&& isActive
			&& maxNodes
			&& maxNodes < nodes) {
				isActive = false;
		}

		return (
			<Button
				right
				active={isActive}
				onMouseDown={event => isActive? (this.onClickAction(event, type) || true) : true}
				icon={icon}
			/>
		);
	}

	renderImageButton = (icon)=> {
		return (
			<FileInputButton
				active={false}
				icon={icon}
				accept="image/*"
				onChange={event =>this.onImageSelect(event)}
			/>
		);
	}

	renderNode = props => {
		const { attributes, children, node, isFocused } = props;

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
			case 'image':
				const src = node.data.get('src');
				return <Image src={src} selected={isFocused} {...attributes} />;
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

	onChange = ({ value, saved }) => {
		let hasChange = this.state.hasChange || (value.document !== this.state.value.document);
		if (saved) {
			hasChange = false
		}

		this.setState({ value, hasChange });
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
		}

		if (mark) {
			event.preventDefault();
			change.toggleMark(mark);
			return true;
		}

		if (isIndentHotkey(event)) {
			event.preventDefault()
			this.onIndent(!event.shiftKey)
			return true;
		}
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
			const parent = value.document.getParent(value.blocks.first().key);
			const isType = (parent && parent.type === type);

			if (isList && isType) {
				change
					.unwrapBlock(type);

				let { value } = change;
				let parent = value.document.getParent(value.blocks.first().key);
				if (!parent || !(['numbered-list', 'bulleted-list'].includes(parent.type))) {
					change
						.setBlocks(DEFAULT_NODE)
				}

			} else if (isList) {
				change
					.unwrapBlock(
						(type === 'bulleted-list') ? 'numbered-list' : 'bulleted-list'
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
			const {value} = this.state;
			const content = JSON.stringify(value.toJSON());
			localStorage.setItem('content', content);
			this.onChange({value, saved: true});
		}

		if (type === 'restore') {
			const existingValue = JSON.parse(localStorage.getItem('content'));
			const value = Value.fromJSON(existingValue || emptyDoc );
			this.onChange({value, saved: true });
		}
	}

	onIndent = (front) => {
		const { value } = this.state;
		const change = value.change();

		if (!this.hasBlock('list-item')) {
			if (!front || !this.hasBlock(DEFAULT_NODE)) {
				return;
			}
			change.setBlocks('list-item').wrapBlock('bulleted-list');
			this.onChange(change);
			return;
		}

		const parent = value.document.getParent(value.blocks.first().key);
		const { type } = parent;

		if (front) {
			if (change.value.document.getDepth(parent.key) >= 3) {
				return;
			}

			change
				.wrapBlock(type);
		} else {
			change
				.unwrapBlock(type);

			let { value } = change;
			let parent = value.document.getParent(value.blocks.first().key);
			if (!parent || !(['numbered-list', 'bulleted-list'].includes(parent.type))) {
				change
					.setBlocks(DEFAULT_NODE)
			}
		}

		this.onChange(change);
	}


	onImageSelect = (event) => {
		event.preventDefault();

		let file = event.target.files[0];
		if (!file) {
			return
		}

		const reader = new FileReader();
		reader.addEventListener('load', () => {
			const change = this.state.value.change().call(insertImage, reader.result);
			this.onChange(change);
		})
		reader.readAsDataURL(file)
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
					{this.renderImageButton('image')}
					{this.renderActionButton('restore', 'clear')}
					{this.renderActionButton('save', 'save')}
				</Toolbar>
				<SlateEditor
					spellCheck
					autoFocus
					placeholder="Enter some rich text..."
					schema={schema}
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

function insertImage(change, src, target) {
	if (target) {
		change.select(target);
	}

	change.insertBlock({
		type: 'image',
		data: { src },
	});
}

const schema = {
	document: {
		last: { type: 'paragraph' },
		normalize: (change, { code, node }) => {
			switch (code) {
				case 'last_child_type_invalid': {
					const paragraph = Block.create('paragraph')
					return change.insertNodeByKey(node.key, node.nodes.size, paragraph)
				}
				default:
			}
		},
	},
	blocks: {
		image: {
			isVoid: true,
		},
	},
}