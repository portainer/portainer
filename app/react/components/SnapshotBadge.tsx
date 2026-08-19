import clsx from 'clsx';

export function SnapshotBadge() {
  return (
    <span
      className={clsx(
        'flex items-center gap-2 rounded-xl',
        'w-fit px-2 py-px',
        'text-xs font-bold',
        'bg-warning-7/20 text-warning-7'
      )}
      aria-label="status-badge"
    >
      <span
        aria-hidden="true"
        aria-label="edge-heartbeat"
        className={clsx('block h-2 w-2 rounded-full', 'bg-warning-7')}
      />
      <span>Snapshot available</span>
    </span>
  );
}
