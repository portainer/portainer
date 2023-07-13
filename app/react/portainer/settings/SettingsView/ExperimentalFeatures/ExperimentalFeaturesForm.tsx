import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { useCallback } from 'react';
import { FlaskConical } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';
import { ExperimentalFeatures } from '@/react/portainer/settings/types';
import { useUpdateExperimentalSettingsMutation } from '@/react/portainer/settings/queries';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { TextTip } from '@@/Tip/TextTip';

import { EnableOpenAIIntegrationSwitch } from './EnableOpenAIIntegrationSwitch';

interface FormValues {
  OpenAIIntegration: boolean;
}
const validation = yup.object({
  OpenAIIntegration: yup.boolean(),
});

interface Props {
  settings: ExperimentalFeatures;
}

export function ExperimentalFeaturesSettingsForm({ settings }: Props) {
  const initialValues: FormValues = settings;

  const mutation = useUpdateExperimentalSettingsMutation();

  const { mutate: updateSettings } = mutation;

  const handleSubmit = useCallback(
    (variables: FormValues) => {
      updateSettings(
        {
          OpenAIIntegration: variables.OpenAIIntegration,
        },
        {
          onSuccess() {
            notifySuccess(
              'Success',
              'Successfully updated experimental features settings'
            );
          },
        }
      );
    },
    [updateSettings]
  );

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
      enableReinitialize
    >
      {({ isValid, dirty }) => (
        <Form className="form-horizontal">
          <TextTip color="blue" icon={FlaskConical}>
            Experimental features may be discontinued without notice.
          </TextTip>

          <br />
          <br />

          <div className="form-group col-sm-12 text-muted small">
            In Portainer releases, we may introduce features that we&apos;re
            experimenting with. These will be items in the early phases of
            development with limited testing.
            <br />
            Our goal is to gain early user feedback, so we can refine, enhance
            and ultimately make our features the best they can be. Disabling an
            experimental feature will prevent access to it.
          </div>

          <EnableOpenAIIntegrationSwitch />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                loadingText="Saving settings..."
                isLoading={mutation.isLoading}
                disabled={!isValid || !dirty}
                className="!ml-0"
                data-cy="settings-experimentalButton"
              >
                Save experimental settings
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
}
