import { AlertTriangle } from 'lucide-react';

import { Badge } from '@@/Badge';
import { Icon } from '@@/Icon';

type Props = {
  serviceTypeLabel: string;
  serviceTypeCount: number;
  serviceTypeHasErrors: boolean;
};

export function ServiceTabLabel({
  serviceTypeLabel,
  serviceTypeCount,
  serviceTypeHasErrors,
}: Props) {
  return (
    <div className="inline-flex items-center">
      {serviceTypeLabel}
      {serviceTypeCount && (
        <Badge
          className="ml-2 flex-none"
          type={serviceTypeHasErrors ? 'warn' : 'info'}
        >
          {serviceTypeHasErrors && (
            <Icon icon={AlertTriangle} className="!mr-1" />
          )}
          {serviceTypeCount}
        </Badge>
      )}
    </div>
  );
}
