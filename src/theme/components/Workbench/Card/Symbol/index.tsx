import Box from '@mui/material/Box';
import * as React from 'react';

const SYMBOL_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SYMBOL_LENGTH = 3;

// TODO(dnguyen0304): Add real implementation for symbol ("stock ticker").
// Copied from: https://stackoverflow.com/a/1349426
const getSymbol = (length: number): string => {
    const characters = [];
    for (let i = 0; i < length; ++i) {
        const index = Math.floor(Math.random() * SYMBOL_CHARACTERS.length);
        characters.push(SYMBOL_CHARACTERS.charAt(index));
    }
    return characters.join('');
};

export default function Symbol(): JSX.Element {
    const symbol = React.useRef<string>(getSymbol(SYMBOL_LENGTH));

    return <Box>{symbol.current}</Box>;
};
