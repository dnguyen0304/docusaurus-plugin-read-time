import styled from '@emotion/styled';
import MergeIcon from '@mui/icons-material/Merge';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import * as React from 'react';
import { PullType, useEditor } from '../../contexts/editor';
import EditorContainer from './Container';
import EditorTab from './Tab';

type iconFontSize = 'small' | 'inherit' | 'large' | 'medium' | undefined;

interface StyledTabProps {
    pull: PullType | undefined;
}

interface TabLabelProps {
    pull: PullType | undefined;
    pullRequestUrl: string;
}

interface TabContentProps {
    index: number,
    activeIndex: number,
}

const getColor = (theme: Theme, pull: PullType | undefined): string => {
    if (pull && pull.state === 'closed') {
        // TODO(dnguyen0304): Add red color for theme palette.
        return theme.palette.error.main;
    }
    return theme.palette.primary.main;
}

const StyledTab = styled(Tab, {
    shouldForwardProp: (prop) => prop !== 'pull',
})<StyledTabProps>(({ theme, pull }) => ({
    '& > span:first-of-type': {
        // TODO(dnguyen0304): Fix type error.
        color: getColor(theme, pull),
    },
}));

const StyledTabLabel = styled('span')({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
});

function TabLabel(
    {
        pull,
        pullRequestUrl,
    }: TabLabelProps
): JSX.Element {

    const getIcon = (): JSX.Element | null => {
        if (pullRequestUrl && pull) {
            let state: 'Open' | 'Closed' | 'Merged' | undefined;
            let icon: JSX.Element | undefined;
            const fontSize: iconFontSize = 'inherit';
            const iconProps = {
                fontSize: fontSize,
                sx: { ml: '0.25rem' },
            };
            if (pull.state === 'open') {
                icon = <ScheduleIcon {...iconProps} />;
                state = 'Open';
            }
            if (pull.closedAt) {
                icon = <ReportOutlinedIcon {...iconProps} />;
                state = 'Closed';
            }
            if (pull.mergedAt) {
                icon = <MergeIcon {...iconProps} />;
                state = 'Merged';
            }
            if (state == undefined) {
                throw new Error('expected state to be defined');
            }
            if (icon === undefined) {
                throw new Error('expected icon to be defined');
            }
            return (
                <Tooltip
                    title={`${state}: ${pullRequestUrl}`}
                    placement='top'
                >
                    {icon}
                </Tooltip>
            );
        }
        return null;
    };

    return (
        <StyledTabLabel>
            default{getIcon()}
        </StyledTabLabel>
    );
};

function TabContent(
    {
        index,
        activeIndex,
    }: TabContentProps
): JSX.Element | null {
    return (
        index === activeIndex
            ? <EditorTab />
            : null
    );
}

// TODO: Fix inconsistent padding or margin in edit mode.
export default function Editor(): JSX.Element {
    const { tabs } = useEditor();
    const [activeIndex, setActiveIndex] = React.useState<number>(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveIndex(newValue);
    };

    return (
        <EditorContainer>
            {/* TODO(dguyen0304): Add bottom box-shadow style. */}
            <Box sx={{
                width: '100%',
                borderBottom: 1,
                borderColor: 'divider',
            }}>
                {/* TODO(dnguyen0304): Set textColor and indicatorColor based on
                    the pull request status. */}
                <Tabs
                    onChange={handleChange}
                    value={activeIndex}
                >
                    {tabs.map((tab, index) =>
                        <StyledTab
                            key={`tab-${index}`}
                            label={
                                <TabLabel
                                    pull={tab.pull}
                                    pullRequestUrl={tab.pullRequestUrl}
                                />
                            }
                            pull={tab.pull}
                        />
                    )}
                </Tabs>
            </Box>
            {tabs.map((tab, index) =>
                <TabContent
                    key={`tab-content-${index}`}
                    index={index}
                    activeIndex={activeIndex}
                />
            )}
        </EditorContainer >
    );
}
