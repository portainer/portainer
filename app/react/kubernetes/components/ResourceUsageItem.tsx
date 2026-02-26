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
      <div className="flex items-center gap-2 mt-1">
        <ProgressBar
          steps={[
            {
              value,
              className: 'progress-bar',
            },
          ]}
          total={total}
        />
        <div className="text-xs flex shrink-0">{annotation}</div>
      </div>
    </FormControl>
  );
}
