import { useRef } from 'react';
import { Form, Formik, FormikProps } from 'formik';

import { notifySuccess } from '@/portainer/services/notifications';

import { Button } from '@@/buttons';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { StickyFooter } from '@@/StickyFooter/StickyFooter';
import { usePreventFormExit } from '@@/form-components/usePreventFormExit';

import { SourceDetail } from '../../../queries/useSource';
import { useUpdateSourceMutation } from '../../../queries/useUpdateSourceMutation';

import { EditConnectionDetailsWidget } from './EditConnectionDetailsWidget';
import { EditAuthWidget } from './EditAuthWidget';
import { EditPollingWidget } from './EditPollingWidget';
import { TestConnectionWidget } from './TestConnectionWidget';
import { SettingsFormValues, validationSchema } from './types';
import { buildUpdatePayload } from './payload';

interface Props {
  source: SourceDetail;
  onCancel: () => void;
}

export function SettingsForm({ source, onCancel }: Props) {
  const updateSource = useUpdateSourceMutation(source.id);
  const formikRef = useRef<FormikProps<SettingsFormValues>>(null);

  usePreventFormExit(() => !!formikRef.current?.dirty);

  const initialValues: SettingsFormValues = {
    name: source.name ?? '',
    url: source.url ?? '',
    tlsSkipVerify: source.connection.tlsSkipVerify ?? false,
    authEnabled: !!source.connection.authentication,
    username: source.connection.authentication?.username ?? '',
    password: '',
    pollingEnabled: !!source.interval,
    interval: source.interval ?? '',
  };

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={(values, { setSubmitting }) => {
        const payload = buildUpdatePayload(values, initialValues);

        updateSource.mutate(payload, {
          onSuccess: () => {
            notifySuccess('Source updated', '');
            onCancel();
          },
          onSettled: () => setSubmitting(false),
        });
      }}
    >
      {({ handleSubmit, isValid, dirty, isSubmitting, resetForm }) => (
        <StickyFooter.Container>
          <Form
            className="form-horizontal space-y-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <EditConnectionDetailsWidget />
            <EditAuthWidget />
            <EditPollingWidget />
            <TestConnectionWidget sourceId={source.id} />
            <StickyFooter className="gap-4">
              <Button
                type="button"
                color="default"
                onClick={() => {
                  resetForm();
                  onCancel();
                }}
                data-cy="cancel-settings-button"
              >
                Cancel
              </Button>
              <LoadingButton
                isLoading={isSubmitting}
                loadingText="Saving..."
                disabled={!isValid || !dirty}
                data-cy="save-settings-button"
              >
                Save Changes
              </LoadingButton>
            </StickyFooter>
          </Form>
        </StickyFooter.Container>
      )}
    </Formik>
  );
}
