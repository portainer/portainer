import { Form, Formik } from 'formik';
import _ from 'lodash';

import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { TextTip } from '@@/Tip/TextTip';
import { FormSection } from '@@/form-components/FormSection';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

import { isDockerEnvironment } from '../../../utils';
import { Environment, EnvironmentStatus } from '../../../types';
import { MetadataFieldset } from '../../../common/MetadataFieldset';
import { NameField } from '../../../common/NameField';
import { EnvironmentMetadata } from '../../../environment.service/create';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '../../../queries/useUpdateEnvironmentMutation';
import { EnvironmentFormActions } from '../EnvironmentFormActions';
import { PublicIPField } from '../PublicIPField';

import { AmtInfo } from './AMTInfo';

interface FormValues {
  name: string;

  publicUrl: string;

  meta: EnvironmentMetadata;

  checkInInterval: number;
  CommandInterval: number;
  PingInterval: number;
  SnapshotInterval: number;
}

export function EdgeForm({
  environment,
  onSuccessUpdate,
}: {
  environment: Environment;
  onSuccessUpdate: (name: string) => void;
}) {
  const { handleSubmit, isLoading } = useUpdateMutation(
    environment,
    onSuccessUpdate
  );

  const isErrorState = environment.Status === EnvironmentStatus.Error;
  const isAmtVisible =
    isDockerEnvironment(environment.Type) && !!environment.EdgeID;

  const initialValues: FormValues = {
    name: environment.Name,
    publicUrl: environment.PublicURL || '',

    meta: {
      tagIds: environment.TagIds,
      groupId: environment.GroupId,
    },

    checkInInterval: environment.EdgeCheckinInterval || 0,
    CommandInterval: environment.Edge.CommandInterval || 0,
    PingInterval: environment.Edge.PingInterval || 0,
    SnapshotInterval: environment.Edge.SnapshotInterval || 0,
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setValues, isValid, setFieldValue }) => (
        <Form className="form-horizontal">
          <FormSection title="Configuration">
            {!isErrorState && (
              <>
                <NameField disabled={isErrorState} />
                <PublicIPField />
              </>
            )}

            {isBE && (
              <TextTip color="blue">
                Use https connection on Edge agent to use private registries
                with credentials.
              </TextTip>
            )}
          </FormSection>

          <FormSection title="Check-in Intervals">
            {environment.Edge.AsyncMode ? (
              <EdgeAsyncIntervalsForm
                values={values}
                onChange={(values) =>
                  setValues((oldValues) => ({
                    ...oldValues,
                    ...values,
                  }))
                }
              />
            ) : (
              <EdgeCheckinIntervalField
                value={values.checkInInterval || 0}
                onChange={(value) => setFieldValue('checkInInterval', value)}
              />
            )}
          </FormSection>

          <MetadataFieldset />

          {isAmtVisible && <AmtInfo environmentId={environment.Id} />}

          <EnvironmentFormActions isLoading={isLoading} isValid={isValid} />
        </Form>
      )}
    </Formik>
  );
}

export function useUpdateMutation(
  environment: Environment,
  onSuccessUpdate: (name: string) => void
) {
  const updateMutation = useUpdateEnvironmentMutation();

  return {
    handleSubmit,
    isLoading: updateMutation.isLoading,
  };

  async function handleSubmit(values: FormValues) {
    const hasRemovedTags =
      _.difference(environment.TagIds, values.meta.tagIds || []).length > 0;

    if (hasRemovedTags) {
      const confirmed = await confirmDestructive({
        title: 'Confirm action',
        message:
          'Removing tags from this environment will remove the corresponding edge stacks when dynamic grouping is being used',
        confirmButton: buildConfirmButton(),
      });

      if (!confirmed) {
        return;
      }
    }

    const payload: UpdateEnvironmentPayload = {
      Name: values.name,
      PublicURL: values.publicUrl,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
      EdgeCheckinInterval: values.checkInInterval,
      Edge: {
        CommandInterval: values.CommandInterval,
        PingInterval: values.PingInterval,
        SnapshotInterval: values.SnapshotInterval,
      },
    };

    payload.URL = `tcp://${environment.URL}`;

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
