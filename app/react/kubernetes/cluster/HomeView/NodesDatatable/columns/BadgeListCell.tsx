import { Badge } from '@@/Badge';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

// Node label and taint sets are long enough to dominate the row, so only the
// first few are shown inline and the rest sit behind a hover badge.
const MAX_INLINE_VALUES = 3;

export function BadgeListCell({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <>-</>;
  }

  const inlineValues = values.slice(0, MAX_INLINE_VALUES);
  const overflowValues = values.slice(MAX_INLINE_VALUES);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {inlineValues.map((value) => (
        <Badge key={value} type="muted">
          {value}
        </Badge>
      ))}
      {overflowValues.length > 0 && (
        <TooltipWithChildren
          focusable
          message={<OverflowList values={overflowValues} />}
        >
          <span aria-label={overflowValues.join(', ')}>
            <Badge type="muted">+{overflowValues.length}</Badge>
          </span>
        </TooltipWithChildren>
      )}
    </div>
  );
}

function OverflowList({ values }: { values: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}
