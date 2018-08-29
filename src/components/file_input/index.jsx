import React from 'react';
import {Button} from '../button';

export class FileInputButton extends React.Component {
	styles = {
		parent: {
			cursor: 'pointer',
			display: 'inlineBlock',
			overflow: 'hidden',
			position: 'absolute',
		},
		file: {
			cursor: 'pointer',
			position: 'absolute',
			opacity: 0,
			right: 0,
			top: 0,
			padding: 0,
			border: 0,
		}
	}
	clearPrevValue = (event) => {
		event.target.value = null;
	}
	render() {
		const {accept, onChange, active, icon} = this.props;
		return (
			<div style={this.styles.parent}>
				<input type="file" accept={accept} onChange={onChange} onClick={event => this.clearPrevValue(event)} style={this.styles.file} title="Insert Image" />
				<Button
					active={active}
					icon={icon}
				>
				</Button>
			</div>
		);
	}
}