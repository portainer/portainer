import { ProgressBar } from '@@/ProgressBar';
import { FormControl } from '@@/form-components/FormControl';

interface ResourceUsageItemProps {
  value: number;
  total: number;
  annotation?: React.ReactNode;
  label: string;
}

export function ResourceUsageItem({
  value,
  total,
  annotation,
  label,
}: ResourceUsageItemProps) {
  return (
    <FormControl label={label}>
      <div className="flex items-center gap-2 mt-1">
        <ProgressBar
          steps={[
            {
              value,
            },
          ]}
          total={total}
        />
        <div className="text-xs flex shrink-0">{annotation}</div>
      </div>
    </FormControl>
  );
}
