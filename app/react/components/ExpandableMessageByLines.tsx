import { useRef, useState, useEffect, useCallback } from 'react';

import { Button } from '@@/buttons';

// use enum so that the tailwind classes aren't interpolated
type MaxLines = 2 | 5 | 10 | 20 | 50;
const lineClampClasses: Record<MaxLines, string> = {
  2: 'line-clamp-[2]',
  5: 'line-clamp-[5]',
  10: 'line-clamp-[10]',
  20: 'line-clamp-[20]',
  50: 'line-clamp-[50]',
};

interface LineBasedProps {
  children: string;
  maxLines?: MaxLines;
}

export function ExpandableMessageByLines({
  children,
  maxLines = 10,
}: LineBasedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const checkTruncation = useCallback(() => {
    const el = contentRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, []);

  useEffect(() => {
    checkTruncation();

    // Use requestAnimationFrame for better performance
    let rafId: number;
    function handleResize() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkTruncation);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [children, maxLines, checkTruncation, isExpanded]);

  return (
    <div className="flex flex-col items-start">
      <div
        ref={contentRef}
        className={`overflow-hidden whitespace-pre-wrap break-words ${
          isExpanded ? '' : lineClampClasses[maxLines]
        }`}
      >
        {children}
      </div>
      {(isTruncated || isExpanded) && (
        <Button
          color="link"
          size="xsmall"
          onClick={() => setIsExpanded(!isExpanded)}
          className="!ml-0 mt-1 !p-0"
          data-cy="expandable-message-lines-button"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
}
