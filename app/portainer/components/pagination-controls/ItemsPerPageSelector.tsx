interface Props {
  value: number;
  onChange(value: number): void;
  showAll: boolean;
}

export function ItemsPerPageSelector({ value, onChange, showAll }: Props) {
  return (
    <span className="limitSelector">
      <span className="space-right">Items per page</span>
      <select
        className="form-control"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-cy="paginationSelect"
      >
        {showAll ? <option value={Number.MAX_SAFE_INTEGER}>All</option> : null}
        {[10, 25, 50, 100].map((v) => (
          <option value={v} key={v}>
            {v}
          </option>
        ))}
      </select>
    </span>
  );
}
