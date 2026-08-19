import { Form, Formik } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Authorized } from '@/react/hooks/useUser';

import { LoadingButton } from '@@/buttons';
import { Input } from '@@/form-components/Input';
import { Select, Option } from '@@/form-components/Input/Select';
import { DetailsTable } from '@@/DetailsTable';
import { DetailsRow } from '@@/DetailsTable/DetailsRow';

import { RestartPolicy } from '../../CreateView/RestartPolicyTab/types';

import { useUpdateRestartPolicyMutation } from './useUpdateRestartPolicyMutation';

interface Props {
  environmentId: EnvironmentId;
  containerId: string;
  nodeName?: string;
  name?: RestartPolicy;
  maximumRetryCount?: number;
  onUpdateSuccess?: (policy: {
    name: RestartPolicy;
    maximumRetryCount?: number;
  }) => void;
}

const restartPolicyOptions: Array<Option<RestartPolicy>> = [
  { label: 'None', value: RestartPolicy.No },
  { label: 'On Failure', value: RestartPolicy.OnFailure },
  { label: 'Always', value: RestartPolicy.Always },
  { label: 'Unless Stopped', value: RestartPolicy.UnlessStopped },
];

export function RestartPolicySection({
  environmentId,
  containerId,
  nodeName,
  name = RestartPolicy.No,
  maximumRetryCount = 0,
  onUpdateSuccess,
}: Props) {
  const updateMutation = useUpdateRestartPolicyMutation();

  return (
    <Formik
      initialValues={{ name, maximumRetryCount }}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, isValid, dirty, setFieldValue }) => (
        <Form>
          <DetailsTable
            dataCy="container-restart-policy-table"
            className="table-bordered table-condensed !m-0"
          >
            <Authorized authorizations="DockerContainerUpdate">
              <DetailsRow
                label="Name"
                columns={[
                  <LoadingButton
                    key="update-button"
                    type="submit"
                    disabled={!isValid || !dirty}
                    isLoading={updateMutation.isLoading}
                    data-cy="container-restart-policy-update-button"
                    loadingText="Updating..."
                  >
                    Update
                  </LoadingButton>,
                ]}
              >
                <Select
                  options={restartPolicyOptions}
                  value={values.name}
                  onChange={(e) => setFieldValue('name', e.target.value)}
                  data-cy="container-restart-policy-select"
                />
              </DetailsRow>
            </Authorized>
            {values.name === RestartPolicy.OnFailure && (
              <DetailsRow label="Maximum Retry Count">
                <Input
                  type="number"
                  value={values.maximumRetryCount}
                  onChange={(e) =>
                    setFieldValue('maximumRetryCount', e.target.valueAsNumber)
                  }
                  data-cy="container-restart-max-retry-input"
                  min={0}
                />
              </DetailsRow>
            )}
          </DetailsTable>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: {
    name: RestartPolicy;
    maximumRetryCount: number;
  }) {
    updateMutation.mutate(
      {
        environmentId,
        containerId,
        nodeName,
        policy: values,
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Restart policy updated');

          onUpdateSuccess?.(values);
        },
      }
    );
  }
}
