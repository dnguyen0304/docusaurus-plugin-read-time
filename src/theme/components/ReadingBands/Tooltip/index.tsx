import { BandFriendlyKey } from '@docusaurus/plugin-read-time';
import type { TooltipProps } from '@mui/material/Tooltip';
import MuiTooltip from '@mui/material/Tooltip';
import * as React from 'react';
import { BANDS } from '../config';

const INDEX_TO_FRIENDLY_KEY: Map<number, BandFriendlyKey> = new Map(
    BANDS
        .map<[number, BandFriendlyKey]>((band, i) => [i, band.friendlyKey])
        .filter(x => x[1] !== 'B0')
);

interface GetTooltipPropsProps {
    readonly index: number;
    readonly topPx: number;
    readonly bottomPx: number;
};

type SubsetTooltipProps =
    Pick<TooltipProps, 'title'>
    & Required<Pick<TooltipProps, 'placement'>>;

function getTooltipProps(
    {
        index,
        topPx,
        bottomPx,
    }: GetTooltipPropsProps
): SubsetTooltipProps {
    const friendlyKey = INDEX_TO_FRIENDLY_KEY.get(index);
    if (index < 2) {
        return {
            title: `${friendlyKey}: { position: ${Math.floor(bottomPx)}px }`,
            placement: 'bottom-start',
        };
    }
    return {
        title: `${friendlyKey}: { position: ${Math.floor(topPx)}px }`,
        placement: 'top-start',
    };
};

interface Props extends GetTooltipPropsProps {
    readonly children: React.ReactElement<any, any>,
};

export default function Tooltip(
    {
        index,
        topPx,
        bottomPx,
        children,
    }: Props
): JSX.Element {
    if (new Set(INDEX_TO_FRIENDLY_KEY.keys()).has(index)) {
        const {
            title,
            placement,
        } = getTooltipProps({ index, topPx, bottomPx })
        return (
            <MuiTooltip
                title={title}
                placement={placement}
                arrow
                open
            >
                {children}
            </MuiTooltip>
        );
    }
    return children;
};
