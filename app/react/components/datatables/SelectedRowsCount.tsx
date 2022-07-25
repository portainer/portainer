interface SelectedRowsCountProps {
  value: number;
}

export function SelectedRowsCount({ value }: SelectedRowsCountProps) {
  return value !== 0 ? (
    <div className="infoBar">{value} item(s) selected</div>
  ) : null;
}
