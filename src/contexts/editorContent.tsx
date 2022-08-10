import * as React from 'react';
import { ReactContextError } from './errors';

// TODO(dnguyen0304): Import from docusaurus-plugin-editor.
interface RawContent {
    [key: string]: string;
}

interface ContextValue {
    readonly rawContent: RawContent;
    readonly setRawContent: React.Dispatch<React.SetStateAction<RawContent>>;
};

const Context = React.createContext<ContextValue | undefined>(undefined);

function useContextValue(content: RawContent): ContextValue {
    const [rawContent, setRawContent] = React.useState<RawContent>(content);

    return React.useMemo(
        () => ({ rawContent, setRawContent }),
        [rawContent, setRawContent],
    );
}

interface Props {
    readonly content: RawContent;
    readonly children: React.ReactNode;
};

function RawContentProvider(
    {
        content,
        children,
    }: Props
): JSX.Element {
    const value = useContextValue(content);

    return (
        <Context.Provider value={value}>
            {children}
        </Context.Provider>
    );
};

function useRawContent(): ContextValue {
    const context = React.useContext(Context);
    if (context === undefined) {
        throw new ReactContextError('RawContentProvider');
    }
    return context;
}

export {
    RawContentProvider,
    useRawContent,
};
