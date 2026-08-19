import { ArrowLeftRight } from 'lucide-react';
import { useFormikContext } from 'formik';

import { Card } from '@@/primitives/Card';

import { Source } from '../../../types';
import { TestConnectionButton } from '../../TestConnectionButton';

import { SettingsFormValues } from './types';
import { buildUpdatePayload } from './payload';

interface Props {
  sourceId: Source['id'];
}

export function TestConnectionWidget({ sourceId }: Props) {
  const { values, initialValues } = useFormikContext<SettingsFormValues>();

  const payload = buildUpdatePayload(values, initialValues);

  return (
    <Card.Container>
      <Card.Header
        icon={ArrowLeftRight}
        title="Test Connection"
        subtitle="Verify settings before saving"
      />
      <Card.Body>
        <p className="mb-4 text-sm text-gray-7 th-highcontrast:text-white th-dark:text-gray-6">
          Test the connection to verify your settings are correct before saving.
        </p>
        <TestConnectionButton
          sourceId={sourceId}
          payload={payload}
          data-cy="source-test-connection-settings-btn"
          showError
        />
      </Card.Body>
    </Card.Container>
  );
}
