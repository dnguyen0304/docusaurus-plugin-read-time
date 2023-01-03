import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import getPercentile from 'percentile';
import * as React from 'react';
import type {
    RunningTotalSample,
    TargetIdToSamples
} from '../../../contexts/samples';
import { useSamples } from '../../../contexts/samples';
import { useToolbar } from '../../../contexts/toolbar';
import { CONTENT_MARGIN_LEFT } from './constants';
import Content from './Content';
import type { ChipData } from './Footer';
import Footer from './Footer';
import Header from './Header';
import Loading from './Loading';
import styles from './styles.module.css';
import type {
    KeyedSample,
    Percentile, Sample as WorkbenchSample
} from './types';

const MILLISECOND_TO_SECOND: number = 1000;

interface BoundedPercentileRank {
    // Lower bound. This range endpoint is inclusive: [lower, upper).
    readonly lower: number;

    // Upper bound. This range endpoint is exclusive: [lower, upper).
    readonly upper: number;
}

interface StyledBoxProps {
    readonly workbenchIsOpen: boolean;
    readonly boxShadowWidth: React.CSSProperties['width'];
};

const StyledBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'workbenchIsOpen' && prop !== 'boxShadowWidth',
})<StyledBoxProps>(({ theme, workbenchIsOpen, boxShadowWidth }) => ({
    position: 'sticky',
    top: 0,
    height: '100vh',
    display: workbenchIsOpen ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    background: `linear-gradient(
        to right,
        ${theme.palette.grey[600]} 0%,
        ${theme.palette.grey[700]} 80%)`,
    borderTopLeftRadius: 'var(--space-l-xl)',
    paddingBottom: 'var(--space-xs)',
    // TODO(dnguyen0304): Investigate refactoring to box-shadow style to reduce
    // complexity.
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: `calc(-1 * ${boxShadowWidth})`,
        width: boxShadowWidth,
        height: '100vh',
        background: `linear-gradient(
            to right,
            transparent,
            rgba(60, 64, 67, 0.15) 70%,
            rgba(60, 64, 67, 0.4) 100%)`,
    },
}));

// TODO(dnguyen0304): Fix not accounting for 0 samples.
const getPercentileRanks = (): readonly BoundedPercentileRank[] => {
    // TODO(dnguyen0304): Extract percentiles setting for theme config.
    // TODO(dnguyen0304): Use set for unique items.
    let ranks = [50, 75];
    if (!ranks.includes(0)) {
        // Include the smallest possible rank.
        ranks.push(0);
    }
    if (!ranks.includes(100)) {
        // Include the largest possible rank.
        ranks.push(100);
    }
    ranks.sort((a, b) => a - b);

    // It is safe to start the iteration at index 1. There are _always_ at least
    // 2 items, that being the smallest and largest possible ranks.
    let boundedRanks: BoundedPercentileRank[] = [];
    for (let i = 1; i < ranks.length; ++i) {
        boundedRanks.push({
            lower: ranks[i - 1],
            upper: ranks[i],
        })
    }
    return boundedRanks;
};

// TODO(dnguyen0304): Add error handling.
const getPercentileScores = (
    boundedRanks: readonly BoundedPercentileRank[],
    // TODO(dnguyen0304): Fix not accounting for empty arrays.
    values: readonly number[],
): readonly Percentile[] => {
    return boundedRanks.map((boundedRank) => {
        const {
            lower: rankLower,
            upper: rankUpper,
        } = boundedRank;
        const [scoreLower, scoreUpper] =
            getPercentile([rankLower, rankUpper], [...values]) as number[];
        return {
            label: `${rankUpper}th`,
            scoreLower,
            scoreUpper,
        };
    });
};

// Convert from keyed RunningTotalSample to keyed WorkbenchSample.
const convertToWorkbenchSample = (
    [targetId, sample]: readonly [string, RunningTotalSample]
): readonly [string, WorkbenchSample] => {
    const readTimeSecond = Math.round(
        sample.runningTotal.visibleTimeMilli / MILLISECOND_TO_SECOND
    );
    return [
        targetId,
        {
            target: sample.target,
            runningTotal: {
                readTimeSecond,
                lastSample: sample.runningTotal.lastSample,
            },
        },
    ];
};

// Sort keyed samples in descending order based on readTimeSecond then targetId.
const sortDescending = (
    a: readonly [string, WorkbenchSample],
    b: readonly [string, WorkbenchSample],
): number => {
    const visibleTimeA = a[1].runningTotal.readTimeSecond;
    const visibleTimeB = b[1].runningTotal.readTimeSecond;
    let criteria = visibleTimeB - visibleTimeA;
    if (visibleTimeA === visibleTimeB) {
        // Use all lowercase to ignore casing.
        const nameA = a[0].toLowerCase();
        const nameB = b[0].toLowerCase();
        if (nameA < nameB) {
            criteria = -1;
        } else if (nameA > nameB) {
            criteria = 1;
        }
    }
    return criteria;
};

// Rank keyed samples based on readTimeSecond.
const rank = (
    keyedSamples: readonly (readonly [string, WorkbenchSample])[],
): readonly KeyedSample[] => {
    if (!keyedSamples.length) {
        return [];
    }
    const ranks: KeyedSample[] = [];
    let currRank = 1;  // Use 1-indexed instead of 0-indexed ranks.
    let prevRankCount = 0;
    let prevReadTime = keyedSamples[0][1].runningTotal.readTimeSecond;
    for (let i = 0; i < keyedSamples.length; i++) {
        const [targetId, sample] = keyedSamples[i];
        const {
            runningTotal: {
                readTimeSecond: currReadTime,
            },
        } = sample;
        if (prevReadTime === currReadTime) {
            ++prevRankCount;
            ranks.push([targetId, sample, currRank]);
        } else if (prevReadTime > currReadTime) {
            currRank = currRank + prevRankCount;
            prevRankCount = 1;
            prevReadTime = currReadTime;
            ranks.push([targetId, sample, currRank]);
        } else if (prevReadTime < currReadTime) {
            throw new Error(
                'expected keyedSamples to be sorted in descending order'
            );
        }
    }
    return ranks;
};

// TODO(dnguyen0304): [medium] Investigate moving rank to WorkbenchSample as
// Metadata.rankCurr for scalability.
const preprocess = (
    targetIdToSamples: TargetIdToSamples,
    isAscending: boolean,
): {
    // TODO(dnguyen0304): Investigate is readonly on both sides is needed.
    readonly percentiles: readonly Percentile[];
    readonly top: readonly KeyedSample[];
    readonly remaining: readonly KeyedSample[];
} => {
    const sorted =
        Object.entries(targetIdToSamples)
            .map(convertToWorkbenchSample)
            .sort((a, b) => sortDescending(a, b));
    const sortedAndRanked = rank(sorted);

    let preprocessed: readonly KeyedSample[] = [];
    let top: readonly KeyedSample[] = [];
    let remaining: readonly KeyedSample[] = [];
    let percentileRanks = [...getPercentileRanks()];

    // TODO(dnguyen0304): Fix confusing ascending vs. descending convention.
    // Warning: Using isAscending anywhere else is strongly discouraged because
    // doing so adds significant maintenance costs.
    if (isAscending) {
        preprocessed = sortedAndRanked.slice().reverse();
        top = preprocessed.slice(-3);
        remaining = preprocessed.slice(0, -3);
    } else {
        preprocessed = sortedAndRanked;
        top = preprocessed.slice(0, 3);
        remaining = preprocessed.slice(3);
        percentileRanks.reverse();
    }

    const percentiles = getPercentileScores(
        percentileRanks,
        preprocessed.map(
            ([, sample,]) => sample.runningTotal.readTimeSecond
        ),
    );

    return {
        percentiles,
        top,
        remaining,
    };
};

export default function Workbench(): JSX.Element {
    const {
        debug: {
            loading: {
                isEnabled: loadingIsEnabled,
            },
        },
    } = useDocusaurusContext()
        .siteConfig
        .themeConfig
            .docupotamusReadTimePlugin;

    const { workbenchIsOpen } = useToolbar();
    const { targetIdToSamples } = useSamples();

    const targetIdToPrevRank = React.useRef<Map<string, number>>(new Map());
    const [isLoading, setIsLoading] = React.useState<boolean>(loadingIsEnabled);
    const [isAscending, setIsAscending] = React.useState<boolean>(false);
    // TODO(dnguyen0304): Investigate renaming to "Minutes Format".
    const [showMinute, setShowMinute] = React.useState<boolean>(false);

    const chips: readonly ChipData[] = [
        {
            label: 'Sort Ascending',
            isClicked: isAscending,
            onClick: () => setIsAscending(prev => !prev),
        },
        {
            label: 'Show Minutes',
            isClicked: showMinute,
            onClick: () => setShowMinute(prev => !prev),
        },
    ];

    const partitionSamples = (): JSX.Element => {
        const {
            percentiles,
            top,
            remaining,
        } = preprocess(targetIdToSamples, isAscending);

        return (
            <>
                <Header
                    keyedSamples={top}
                    targetIdToPrevRank={targetIdToPrevRank.current}
                    showMinute={showMinute}
                />
                <Content
                    keyedSamples={remaining}
                    targetIdToPrevRank={targetIdToPrevRank.current}
                    showMinute={showMinute}
                    percentiles={percentiles}
                />
                <Footer
                    chips={chips}
                    marginLeft={CONTENT_MARGIN_LEFT}
                />
            </>
        )
    };

    // TODO(dnguyen0304): Add real implementation for rank tracking.
    React.useEffect(() => {
        const existingKeys = Array.from(targetIdToPrevRank.current.keys());
        const targetIds = Object.keys(targetIdToSamples);
        if (existingKeys.length === targetIds.length) {
            return;
        }
        for (const targetId of targetIds) {
            const prevRank = targetIdToPrevRank.current.get(targetId);
            if (prevRank) {
                continue;
            }
            targetIdToPrevRank.current.set(
                targetId,
                // Use 1-indexed instead of 0-indexed ranks.
                Math.floor(Math.random() * targetIds.length + 1) + 1,
            );
        }
    }, [targetIdToSamples]);

    return (
        <StyledBox
            className={isLoading ? styles.workbench_container__load : ''}
            workbenchIsOpen={workbenchIsOpen}
            boxShadowWidth='var(--space-xs)'
        >
            {
                isLoading
                    ? <Loading setIsLoading={setIsLoading} />
                    : partitionSamples()
            }
        </StyledBox>
    );
};
