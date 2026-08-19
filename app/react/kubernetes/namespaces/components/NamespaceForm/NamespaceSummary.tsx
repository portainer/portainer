import { isEqual } from 'lodash';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { NamespaceFormValues } from '../../types';

interface Props {
  initialValues: NamespaceFormValues;
  values: NamespaceFormValues;
  isValid: boolean;
}

export function NamespaceSummary({ initialValues, values, isValid }: Props) {
  // only compare the values from k8s related resources
  const { registries: newRegistryValues, ...newK8sValues } = values;
  const { registries: oldRegistryValues, ...oldK8sValues } = initialValues;
  const hasChanges = !isEqual(newK8sValues, oldK8sValues);
  if (!hasChanges || !isValid) {
    return null;
  }

  const isCreatingNamespace = !oldK8sValues.name && newK8sValues.name;

  const enabledQuotaInitialValues = initialValues.resourceQuota.enabled;
  const enabledQuotaNewValues = values.resourceQuota.enabled;

  const isCreatingResourceQuota =
    !enabledQuotaInitialValues && enabledQuotaNewValues;
  const isUpdatingResourceQuota =
    enabledQuotaInitialValues && enabledQuotaNewValues;
  const isDeletingResourceQuota =
    enabledQuotaInitialValues && !enabledQuotaNewValues;

  return (
    <FormSection title="Summary" isFoldable defaultFolded={false}>
      <div className="form-group">
        <div className="col-sm-12">
          <TextTip color="blue">
            Portainer will execute the following Kubernetes actions.
          </TextTip>
        </div>
      </div>
      <div className="col-sm-12 small text-muted pt-1">
        <ul>
          {isCreatingNamespace && (
            <li>
              Create a <span className="bold">Namespace</span> named{' '}
              <code>{values.name}</code>
            </li>
          )}
          {isCreatingResourceQuota && (
            <li>
              Create a <span className="bold">ResourceQuota</span> named{' '}
              <code>portainer-rq-{values.name}</code>
            </li>
          )}
          {isUpdatingResourceQuota && (
            <li>
              Update a <span className="bold">ResourceQuota</span> named{' '}
              <code>portainer-rq-{values.name}</code>
            </li>
          )}
          {isDeletingResourceQuota && (
            <li>
              Delete a <span className="bold">ResourceQuota</span> named{' '}
              <code>portainer-rq-{values.name}</code>
            </li>
          )}
        </ul>
      </div>
    </FormSection>
  );
}
