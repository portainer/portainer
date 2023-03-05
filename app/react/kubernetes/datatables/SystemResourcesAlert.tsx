import { useAuthorizations } from '@/react/hooks/useUser';

import { TextTip } from '@@/Tip/TextTip';

interface Props {
  showSystemResources: boolean;
}

export function SystemResourcesAlert({ showSystemResources }: Props) {
  const authorized = useAuthorizations(
    'K8sAccessSystemNamespaces',
    undefined,
    true
  );
  if (!authorized) {
    return null;
  }

  return (
    <div className="w-full">
      {!showSystemResources && (
        <TextTip color="blue" className="!mb-0">
          System resources are hidden, this can be changed in the table settings
        </TextTip>
      )}
    </div>
  );
}
