import _ from 'lodash';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { CreateNamespaceFormValues } from '../CreateView/types';

interface Props {
  initialValues: CreateNamespaceFormValues;
  values: CreateNamespaceFormValues;
  isValid: boolean;
}

export function NamespaceSummary({ initialValues, values, isValid }: Props) {
  const hasChanges = !_.isEqual(values, initialValues);

  if (!hasChanges || !isValid) {
    return null;
  }

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
          <li>
            Create a <span className="bold">Namespace</span> named{' '}
            <code>{values.name}</code>
          </li>
          {values.resourceQuota.enabled && (
            <li>
              Create a <span className="bold">ResourceQuota</span> named{' '}
              <code>portainer-rq-{values.name}</code>
            </li>
          )}
        </ul>
      </div>
    </FormSection>
  );
}
