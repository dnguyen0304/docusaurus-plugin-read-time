import BrowserOnly from '@docusaurus/BrowserOnly';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import * as React from 'react';
import type { DocupotamusThemeConfig } from '../../../utils';
// import { getViewportHeight } from '../../../utils';
import styles from './styles.module.css';

// type DOMRectSubset = Pick<DOMRect, 'top' | 'bottom'>;

async function getElement(selector: string): Promise<Element> {
    return new Promise(resolve => {
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }
        const observer = new MutationObserver(mutations => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });
        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            },
        );
    });
}

// function getContainerRect(target: Element): DOMRectSubset {
//     const containerRect = target.parentElement?.getBoundingClientRect();
//     if (!containerRect) {
//         throw new Error('no parent container');
//     }
//     return {
//         top: Math.max(containerRect.top, 0),
//         bottom: Math.min(containerRect.bottom, getViewportHeight()),
//     }
// }

// function isVisible(target: Element): boolean {
//     const targetRect = target.getBoundingClientRect() as DOMRectSubset;
//     const containerRect = getContainerRect(target);

//     const topIsVisible =
//         targetRect.top > containerRect.top
//         && targetRect.top < containerRect.bottom;
//     const bottomIsVisible =
//         targetRect.bottom < containerRect.bottom
//         && targetRect.bottom > containerRect.top;

//     return topIsVisible || bottomIsVisible;
// }

// function onVisibilityChange(
//     target: Element,
//     callback: (current: boolean) => void,
// ) {
//     let prev: boolean | undefined;
//     return () => {
//         const curr = isVisible(target);
//         if (prev === undefined || curr != prev) {
//             prev = curr;
//             callback(curr);
//         }
//     }
// }

function VisibilityObserver(): JSX.Element | null {
    const {
        readTime: {
            debug: {
                border: {
                    isEnabled: debugBorderIsEnabled,
                },
            },
        },
    } = useDocusaurusContext()
        .siteConfig
        .themeConfig
        .docupotamus as DocupotamusThemeConfig;

    const observerRef = React.useRef<IntersectionObserver | null>(
        ExecutionEnvironment.canUseIntersectionObserver
            ? new IntersectionObserver((entries, observer) => {
                console.log(entries);
                // classList.toggle
            }, {
                // root: containerElement,
                // rootMargin, // must include "px"
                threshold: [0.25, 0.5, 0.75],
            })
            : null
    );
    const [element, setElement] = React.useState<Element | null>(null);

    // const handleVisibilityChange = (current: boolean) => {
    //     // TODO(dnguyen0304): Add real implementation.
    //     return console.log(current);
    // };

    React.useEffect(() => {
        const doGetElement = async () => {
            // TODO(dnguyen0304): Change to include all child elements.
            const found = await getElement(`main[class*='docMainContainer'] article .markdown h2`);
            setElement(found);
        }
        doGetElement();
    }, []);

    React.useEffect(() => {
        if (!element) {
            return;
        }
        if (!observerRef.current) {
            return;
        }
        observerRef.current.observe(element);
        return () => observerRef.current?.unobserve(element);
    }, [element]);

    // React.useEffect(() => {
    //     if (!element) {
    //         return;
    //     }
    //     const handleScroll = onVisibilityChange(
    //         element,
    //         handleVisibilityChange,
    //     );

    //     window.removeEventListener('scroll', handleScroll);
    //     window.addEventListener('scroll', handleScroll, { passive: true });
    //     return () => window.removeEventListener('scroll', handleScroll);
    // }, [element]);

    // TODO(dnguyen0304): Add tooltip with visibility.
    React.useEffect(() => {
        if (!debugBorderIsEnabled || !element) {
            return;
        }
        element.classList.add(styles.visibilityTracker_element);
        return () => element.classList.remove(styles.visibilityTracker_element);
    }, [element]);

    return null;
};

export default (): JSX.Element | null => {
    return (
        <BrowserOnly >
            {() => <VisibilityTracker />}
        </BrowserOnly>
    );
};