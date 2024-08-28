import { Formik } from 'formik';
import { useMutation } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { useState } from 'react';
import { FormikHelpers } from 'formik/dist/types';

import { invalidateContainer } from '@/react/docker/containers/queries/useContainer';
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
  onChange,
  redeploy,
  initialValues,
  isImageInvalid,
}: {
  initialValues: Values;
  onChange: (values: Values) => void;
  redeploy: () => Promise<boolean>;
  isImageInvalid: boolean;
}) {
  const {
    params: { from: containerId },
  } = useCurrentStateAndParams();

  const [savedInitValues, setSavedInitValues] = useState(initialValues);

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
            onChange={(values) => {
              onChange(values);
              setValues(values);
            }}
            errors={errors}
          />

          <div className="form-group">
            <div className="col-sm-12 flex items-center gap-4">
              <LoadingButton
                isLoading={updateMutation.isLoading}
                data-cy="update-limits-button"
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

  function handleSubmit(values: Values, helper: FormikHelpers<Values>) {
    updateMutation.mutate(values, {
      onSuccess: (data) => {
        if (data) {
          notifySuccess('Success', 'Limits updated');
          helper.resetForm({ values: initialValues });
          invalidateContainer(environmentId, containerId);
        }
      },
    });
  }

  function settingUnlimitedResources(values: Values) {
    return (
      (savedInitValues.limit > 0 && values.limit === 0) ||
      (savedInitValues.reservation > 0 && values.reservation === 0) ||
      (savedInitValues.cpu > 0 && values.cpu === 0)
    );
  }

  // return true only if limits are updated
  // return false otherwise(container recreated, user canceled container recreation, etc.)
  async function updateLimitsOrCreate(values: Values) {
    if (settingUnlimitedResources(values)) {
      const ret = await redeploy();

      if (ret === false) {
        return false;
      }

      setSavedInitValues(values);
      return false;
    }

    setSavedInitValues(values);
    await updateLimits(environmentId, containerId, values);

    return true;
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
