import { KubernetesResourceAction } from '../../summary/types';

export type SummaryAction = {
  action: KubernetesResourceAction;
  kind: string;
  name: string;
  type?: string;
};

/**
 * Converts configuration form values to summary actions for display
 */
export function getConfigurationActions({
  isCreate,
  secretName,
  secretType,
}: {
  isCreate: boolean;
  secretName: string;
  secretType: string;
}): SummaryAction[] {
  const action = isCreate ? 'Create' : 'Update';

  return [
    {
      action,
      kind: 'Secret',
      name: secretName,
      type: secretType,
    },
  ];
}
