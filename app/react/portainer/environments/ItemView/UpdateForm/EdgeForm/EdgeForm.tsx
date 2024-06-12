import { Form, Formik } from 'formik';

import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { isDockerEnvironment } from '@/react/portainer/environments/utils';
import {
  Environment,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';
import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset';
import { NameField } from '@/react/portainer/environments/common/NameField';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

import { EnvironmentFormActions } from '../EnvironmentFormActions';
import { PublicIPField } from '../PublicIPField';

import { AmtInfo } from './AMTInfo';
import { useUpdateMutation } from './useUpdateMutation';
import { FormValues } from './types';

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
