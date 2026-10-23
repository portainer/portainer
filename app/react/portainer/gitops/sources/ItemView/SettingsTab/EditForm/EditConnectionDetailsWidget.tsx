import { LinkIcon } from 'lucide-react';
import { useFormikContext } from 'formik';

import { Card } from '@@/primitives/Card';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';

import { SettingsFormValues } from './types';

export function EditConnectionDetailsWidget() {
  const { values, errors, setFieldValue } =
    useFormikContext<SettingsFormValues>();

  return (
    <Card.Container>
      <Card.Header
        icon={LinkIcon}
        title="Connection Details"
        subtitle="Source name, URL, and connection settings"
      />
      <Card.Body>
        <FormControl inputId="name" label="Name" errors={errors.name} required>
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={(e) => setFieldValue('name', e.target.value)}
            data-cy="source-name-input"
          />
        </FormControl>
        <FormControl
          inputId="url"
          label="Repository URL"
          errors={errors.url}
          required
        >
          <Input
            id="url"
            name="url"
            value={values.url}
            onChange={(e) => setFieldValue('url', e.target.value)}
            data-cy="source-url-input"
          />
        </FormControl>
        <SwitchField
          label="Skip TLS verification"
          name="tlsSkipVerify"
          checked={values.tlsSkipVerify}
          onChange={(checked) => setFieldValue('tlsSkipVerify', checked)}
          data-cy="source-tls-skip-verify"
        />
      </Card.Body>
    </Card.Container>
  );
}
