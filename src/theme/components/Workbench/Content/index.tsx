import type { PercentileRankStyle } from '@docusaurus/plugin-read-time';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import { usePercentile } from '../../../../contexts/percentile';
import Card from '../Card';
import { CARD_KEY_PREFIX } from '../constants';
import type { KeyedSample, Percentile } from '../types';

const PARTITION_KEY_PREFIX = 'contentPartition';
const LARGEST_PERCENTILE_RANK = 100;

// TODO(dnguyen0304): Investigate if position is needed.
interface Partition {
    readonly label: string;
    readonly keyedSamples: readonly KeyedSample[];
}

const StyledBox = styled(Box)({
    overflow: 'scroll',
    marginBottom: 'var(--space-2xs)',
});

const StyledDivider = styled(Divider)({
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 'var(--font-size--2)',
    margin: '0 var(--space-m)',
    '&::before, &::after': {
        borderColor: '#fff',
    },
});

// TODO(dnguyen0304): Investigate migrating to use MUI List.
//   See: https://mui.com/material-ui/react-list/
const StyledOrderedList = styled('ol')({
    margin: 0,
    padding: 0,
});

const formatPercentileRank = (
    rank: number,
    style: PercentileRankStyle,
): string => {
    if (style === 'p') {
        return `p${rank}`;
    }
    if (style === 'th') {
        return `${rank}th`;
    }
    if (style === 'full-lower') {
        return `${rank}th percentile`;
    }
    if (style === 'full-upper') {
        return `${rank}th Percentile`;
    }
    return '';
};

const getDivider = (
    label: string,
    excludedLabel: string,
    partitionIndex: number,
): JSX.Element | null => {
    // TODO(dnguyen0304): Fix not showing first percentile divider.
    if (label === excludedLabel || partitionIndex !== 0) {
        return null;
    }
    return (
        <StyledDivider
            key={`${PARTITION_KEY_PREFIX}-${label}`}
            textAlign='right'
        >
            {label}
        </StyledDivider>
    );
};

interface Props {
    readonly keyedSamples: readonly KeyedSample[];
    readonly targetIdToPrevRank: ReadonlyMap<string, number>;
    readonly showMinute: boolean;
    readonly hideUnread: boolean;
    readonly percentiles: readonly Percentile[];
};

export default function Content(
    {
        keyedSamples,
        targetIdToPrevRank,
        showMinute,
        hideUnread,
        percentiles,
    }: Props
): JSX.Element {
    const {
        percentile: {
            style: percentileRankStyle,
        },
    } = useDocusaurusContext()
        .siteConfig
        .themeConfig
            .docupotamusReadTimePlugin;

    const { minRank, minScore } = usePercentile();

    const [partitions, setPartitions] = React.useState<Partition[]>([]);
    const [excludedLabel, setExcludedLabel] = React.useState<string>('');

    React.useEffect(() => {
        const seen = new Set<string>();
        const newPartitions: Partition[] = percentiles.map((percentile) => {
            const { rank, scoreLower, scoreUpper } = percentile;
            let partitionedSamples: KeyedSample[] = [];
            // TODO(dnguyen0304): Fix unnecessary iteration passes.
            for (const current of keyedSamples) {
                const [targetId, sample] = current;
                const score = sample.runningTotal.readTimeSecond;
                const isInside = score > scoreLower && score <= scoreUpper;
                const isMin = rank === minRank && score === minScore;
                if (seen.has(targetId)) {
                    continue;
                }
                if (hideUnread && score === 0) {
                    continue;
                }
                if (!isInside && !isMin) {
                    continue;
                }
                partitionedSamples.push(current);
                seen.add(targetId);
            }
            return {
                label: formatPercentileRank(rank, percentileRankStyle),
                keyedSamples: partitionedSamples,
            };
        });
        setPartitions(newPartitions);
    }, [percentiles]);

    React.useEffect(() => {
        // Hide the divider for the 100th percentile because it creates a
        // separation between the header and content cards.
        setExcludedLabel(formatPercentileRank(
            LARGEST_PERCENTILE_RANK,
            percentileRankStyle,
        ));
    }, []);

    return (
        <StyledBox>
            {partitions.map((partition) => {
                const {
                    label,
                    keyedSamples: partitionedSamples,
                } = partition;
                return (
                    <StyledOrderedList>
                        {partitionedSamples.map((keyedSample, i) => {
                            const [
                                targetId,
                                sample,
                                rankCurr,
                            ] = keyedSample;
                            const rankPrev =
                                targetIdToPrevRank.get(targetId);
                            const divider = getDivider(label, excludedLabel, i);
                            return (
                                <Card
                                    key={`${CARD_KEY_PREFIX}-${targetId}`}
                                    targetId={targetId}
                                    details={sample.target.snippet}
                                    percentileDivider={divider}
                                    rankCurr={rankCurr}
                                    rankPrev={rankPrev}
                                    readTimeSecond={
                                        sample.runningTotal.readTimeSecond
                                    }
                                    showMinute={showMinute}
                                    isHidden={sample.isHidden}
                                />
                            );
                        })}
                    </StyledOrderedList>
                );
            })}
        </StyledBox>
    );
};
