import { Formik } from 'formik';
import { useMutation } from 'react-query';
import { useCurrentStateAndParams } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { mutationOptions, withError } from '@/react-tools/react-query';
import { useSystemLimits } from '@/react/docker/proxy/queries/useInfo';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { LoadingButton } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';

import { updateContainer } from '../../queries/useUpdateContainer';

import {
  ResourceFieldset,
  resourcesValidation,
  Values,
} from './ResourcesFieldset';
import { toConfigCpu, toConfigMemory } from './memory-utils';

export function EditResourcesForm({
  redeploy,
  initialValues,
  isImageInvalid,
}: {
  initialValues: Values;
  redeploy: (values: Values) => Promise<void>;
  isImageInvalid: boolean;
}) {
  const {
    params: { from: containerId },
  } = useCurrentStateAndParams();
  if (!containerId || typeof containerId !== 'string') {
    throw new Error('missing parameter "from"');
  }

  const updateMutation = useMutation(
    updateLimitsOrCreate,
    mutationOptions(withError('Failed to update limits'))
  );

  const environmentId = useEnvironmentId();
  const systemLimits = useSystemLimits(environmentId);

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={() => resourcesValidation(systemLimits)}
    >
      {({ values, errors, setValues, dirty, submitForm }) => (
        <div className="edit-resources p-5">
          <ResourceFieldset
            values={values}
            onChange={setValues}
            errors={errors}
          />

          <div className="form-group">
            <div className="col-sm-12 flex items-center gap-4">
              <LoadingButton
                isLoading={updateMutation.isLoading}
                disabled={isImageInvalid || !dirty}
                loadingText="Update in progress..."
                type="button"
                onClick={submitForm}
              >
                Update Limits
              </LoadingButton>
              {settingUnlimitedResources(values) && (
                <TextTip>
                  Updating any resource value to &apos;unlimited&apos; will
                  redeploy this container.
                </TextTip>
              )}
            </div>
          </div>
        </div>
      )}
    </Formik>
  );

  function handleSubmit(values: Values) {
    updateMutation.mutate(values, {
      onSuccess: () => {
        notifySuccess('Success', 'Limits updated');
      },
    });
  }

  function settingUnlimitedResources(values: Values) {
    return (
      (initialValues.limit > 0 && values.limit === 0) ||
      (initialValues.reservation > 0 && values.reservation === 0) ||
      (initialValues.cpu > 0 && values.cpu === 0)
    );
  }

  async function updateLimitsOrCreate(values: Values) {
    if (settingUnlimitedResources(values)) {
      return redeploy(values);
    }

    return updateLimits(environmentId, containerId, values);
  }
}

async function updateLimits(
  environmentId: EnvironmentId,
  containerId: string,
  values: Values
) {
  return updateContainer(environmentId, containerId, {
    // MemorySwap: must be set
    // -1: non limits, 0: treated as unset(cause update error).
    MemorySwap: -1,
    MemoryReservation: toConfigMemory(values.reservation),
    Memory: toConfigMemory(values.limit),
    NanoCpus: toConfigCpu(values.cpu),
  });
}
