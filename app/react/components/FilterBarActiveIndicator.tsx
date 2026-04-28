interface Props {
  label: string;
  onClear: () => void;
}

export function FilterBarActiveIndicator({ label, onClear }: Props) {
  return (
    <div
      className="flex items-center gap-4 whitespace-nowrap bg-[var(--bg-blocklist-hover-color)] px-5"
      data-cy="active-filter-indicator"
    >
      <span className="text-sm text-[var(--text-muted-color)]">
        Showing:{' '}
        <span className="font-semibold text-[var(--text-summary-color)]">
          {label}
        </span>
      </span>
      <button
        type="button"
        className="close-button cursor-pointer border-0 bg-transparent p-0 text-[21px] font-bold leading-none text-[var(--button-close-color)] opacity-[var(--button-opacity)] hover:opacity-[var(--button-opacity-hover)]"
        onClick={onClear}
        aria-label="Clear filter"
        data-cy="clear-filter-button"
      >
        &times;
      </button>
    </div>
  );
}
