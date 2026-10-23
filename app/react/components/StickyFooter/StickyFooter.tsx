import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import styles from './StickyFooter.module.css';

interface Props {
  className?: string;
}

/**
 * Fixed action bar pinned to the bottom of the viewport.
 *
 * Wrap the page content in `StickyFooter.Container` so the footer never
 * obscures the last element:
 *
 * ```tsx
 * <StickyFooter.Container>
 *   <form>
 *     ...
 *     <StickyFooter>
 *       <Button>Cancel</Button>
 *       <Button>Save</Button>
 *     </StickyFooter>
 *   </form>
 * </StickyFooter.Container>
 * ```
 */
export function StickyFooter({
  className,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        styles.actionBar,
        'fixed bottom-0 right-0 z-40 h-16',
        'flex items-center px-6',
        'border-t border-[var(--border-widget-color)] bg-[var(--bg-widget-color)]',
        'shadow-[0_-2px_5px_rgba(0,0,0,0.1)]',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Wraps page content to prevent `StickyFooter` from overlapping the bottom
 * of the page. Always use this as the outermost wrapper when rendering a
 * `StickyFooter` inside a page or form.
 */
function Container({ children }: PropsWithChildren<unknown>) {
  return <div className="pb-20">{children}</div>;
}

StickyFooter.Container = Container;
