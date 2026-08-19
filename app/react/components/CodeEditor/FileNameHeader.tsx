import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { CopyButton } from '@@/buttons/CopyButton';

type FileNameHeaderProps = {
  fileName: string;
  copyText: string;
  className?: string;
  style?: React.CSSProperties;
} & AutomationTestingProps;

/**
 * FileNameHeaderRow: Outer container for file name headers (single or multiple columns).
 * Use this to wrap one or more <FileNameHeader> components (and optional dividers).
 */
export function FileNameHeaderRow({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={clsx(
        'text-muted flex w-full overflow-auto border-0 border-b border-solid border-b-gray-5 bg-gray-2 text-sm [scrollbar-gutter:stable] th-highcontrast:border-b-gray-2 th-highcontrast:bg-black th-dark:border-b-gray-7 th-dark:bg-gray-10',
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * FileNameHeader: Renders a file name with a copy button, styled for use above a code editor or diff viewer.
 * Should be used inside FileNameHeaderRow.
 */
export function FileNameHeader({
  fileName,
  copyText,
  className = '',
  style,
  'data-cy': dataCy,
}: FileNameHeaderProps) {
  return (
    <div
      className={clsx(
        'text-muted flex w-full items-center justify-between gap-x-2 overflow-auto px-4 py-1 text-sm',
        className
      )}
      style={style}
    >
      {fileName}
      <CopyButton
        data-cy={dataCy}
        copyText={copyText}
        color="link"
        className="!pr-0 !text-sm !font-medium hover:no-underline focus:no-underline"
        indicatorPosition="left"
      >
        Copy
      </CopyButton>
    </div>
  );
}
