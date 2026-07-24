import { useEffect } from 'react';
import { useFormikContext } from 'formik';
import { isEqual } from 'lodash';

import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';

import { Alert } from '@@/Alert';

import { FormValues, gitFormValuesToTestPayload } from '../type';
import { useTestSourceConnection } from '../useTestSourceConnection';
import { validateGitConnection } from '../validation';

export function ConnectionTest() {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const { git } = values;

  const livePayload = validateGitConnection().isValidSync(git)
    ? gitFormValuesToTestPayload(git)
    : undefined;

  const debouncedPayload = useDebouncedValue(livePayload);
  const query = useTestSourceConnection(debouncedPayload);

  const settled = isEqual(debouncedPayload, livePayload) && !query.isFetching;
  const connectionOk = settled && query.data?.success === true;

  useEffect(() => {
    setFieldValue('git.connectionOk', connectionOk);
  }, [connectionOk, setFieldValue]);

  if (!livePayload) {
    return null;
  }

  if (!settled) {
    return (
      <Alert color="info" title="Testing connection..." className="mt-4">
        Checking that Portainer can reach the repository.
      </Alert>
    );
  }

  if (query.isError) {
    return (
      <Alert color="error" title="Connection failed" className="mt-4">
        Unable to test the connection. Please try again.
      </Alert>
    );
  }

  if (query.data?.success) {
    return (
      <Alert color="success" title="Connection successful" className="mt-4">
        Portainer reached the repository with these details.
      </Alert>
    );
  }

  return (
    <Alert color="error" title="Connection failed" className="mt-4">
      {query.data?.error || 'Unable to reach the repository.'}
    </Alert>
  );
}
