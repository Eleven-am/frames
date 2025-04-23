import { useState, useCallback } from 'react';

import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

import { RoundedButton } from '@/components/button';
import { ResizablePanel } from '@/components/resizeablePanel';
import { tw } from '@/utils/style';


interface ExpandingTextProps {
    text: string;
    lines: number;
    expandedClassName: string;
    collapsedClassName: string;
    className?: string;
    hideButton?: boolean;
}

export function ExpandingText ({
    text,
    lines,
    className,
    hideButton = false,
    expandedClassName,
    collapsedClassName,
}: ExpandingTextProps) {
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(true);

    const toggleExpanded = useCallback(() => {
        setExpanded((prevState) => !prevState);
    }, []);

    const paragraphRef = useCallback((expanded: boolean) => (node: HTMLParagraphElement | null) => {
        if (node) {
            if (text.length === 0) {
                setCanExpand(false);

                return;
            }

            const paragraphHeight = node.offsetHeight;
            const lineHeightString = document.defaultView?.getComputedStyle(node, null).getPropertyValue('line-height') || '0';
            const lineHeight = parseInt(lineHeightString, 10);
            const innerLines = paragraphHeight / lineHeight;

            if ((innerLines !== 0) && ((innerLines < lines) || (expanded && innerLines === lines))) {
                setCanExpand(false);
            }
        }
    }, [lines, text.length]);

    return (
        <>
            <ResizablePanel
                keyId={expanded.valueOf().toString()}
                className={className}
            >
                {
                    expanded
                        ? (
                            <p className={expandedClassName} ref={paragraphRef(true)}>
                                {text}
                            </p>
                        )
                        : (
                            <p className={collapsedClassName} ref={paragraphRef(false)}>
                                {text}
                            </p>
                        )
                }
            </ResizablePanel>
            <div
                className={
                    tw('w-full flex items-center justify-end p-4', {
                        block: canExpand,
                        hidden: !canExpand || hideButton,
                    })
                }
            >
                <RoundedButton
                    title={expanded ? 'Collapse' : 'Expand'}
                    onClick={toggleExpanded}
                >
                    {
                        expanded
                            ? <FiChevronUp />
                            : <FiChevronDown />
                    }
                </RoundedButton>
            </div>
        </>
    );
}
