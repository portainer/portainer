import { Badge } from '@@/Badge';

export function WorkflowBadge({ className }: { className?: string }) {
  return (
    <Badge type="info" className={className}>
      Workflow
    </Badge>
  );
}
