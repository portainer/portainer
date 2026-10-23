import { LockIcon } from 'lucide-react';
import { useFormikContext } from 'formik';

import { Card } from '@@/primitives/Card';

import { GitAuthentication } from '../../../components/GitAuthentication';

import { SettingsFormValues } from './types';

export function EditAuthWidget() {
  const { values, errors, setValues } = useFormikContext<SettingsFormValues>();

  return (
    <Card.Container>
      <Card.Header
        icon={LockIcon}
        title="Authentication"
        subtitle="Choose how Portainer authenticates to this source"
      />
      <Card.Body>
        <GitAuthentication
          values={{
            authEnabled: values.authEnabled,
            username: values.username,
            password: values.password,
          }}
          isEditing
          errors={{ username: errors.username, password: errors.password }}
          onChange={(changed) =>
            setValues((oldValues) => ({ ...oldValues, ...changed }))
          }
          toggleDataCy="source-auth-enabled"
        />
      </Card.Body>
    </Card.Container>
  );
}
