import { FormControl } from '@@/form-components/FormControl';
import { ProgressBar } from '@@/ProgressBar';

interface ResourceUsageItemProps {
  value: number;
  total: number;
  annotation?: React.ReactNode;
  label: string;
  isLoading?: boolean;
  dataCy?: string;
}

export function ResourceUsageItem({
  value,
  total,
  annotation,
  label,
  isLoading = false,
  dataCy,
}: ResourceUsageItemProps) {
  return (
    <FormControl
      label={label}
      isLoading={isLoading}
      className={isLoading ? 'mb-1.5' : ''}
      dataCy={dataCy}
    >
      <div className="mt-1 flex items-center gap-2">
        <ProgressBar
          steps={[
            {
              value,
              className: 'progress-bar',
            },
          ]}
          total={total}
        />
        <div className="flex shrink-0 text-xs">{annotation}</div>
      </div>
    </FormControl>
  );
}
