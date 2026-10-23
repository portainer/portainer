import clsx from 'clsx';

interface Props {
  className?: string;
}

export function VerticalSeparator({ className }: Props) {
  return (
    <div
      className={clsx(
        'mx-2 h-6 w-px shrink-0 bg-[var(--border-widget)]',
        className
      )}
      aria-hidden="true"
    />
  );
}
