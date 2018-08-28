import React from 'react';
import styled from 'react-emotion';

const Icon = styled(({ className, ...rest }) => {
	return <span className={`material-icons ${className}`} {...rest} />
})`
	font-size: 18px;
	vertical-align: text-bottom;
`

export const Button = styled(({ className, icon }) => {
	return (
		<span className={className} >
			<Icon>{icon}</Icon>
		</span>
	);
})`
	cursor: pointer;
	float: ${props =>
		props.right ? 'right' : ''};
	color: ${props =>
		props.reversed
			? props.active ? 'white' : '#aaa'
			: props.active ? 'black' : '#ccc'};
`