import styled from 'react-emotion';

export const Image = styled('img')`
	display: block;
	max-width: 100%;
	max-height: 20em;
	box-shadow: ${props => (props.selected ? '0 0 0 2px blue;' : 'none')};
`