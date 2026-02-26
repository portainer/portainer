import { Formik, Form, FormikErrors } from 'formik';

import { useUpdateEnvironmentMutation } from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import { NameField } from '@/react/portainer/environments/common/NameField/NameField';
import { EnvironmentUrlField } from '@/react/portainer/environments/common/EnvironmentUrlField/EnvironmentUrlField';
import { PublicUrlField } from '@/react/portainer/environments/common/PublicUrlField/PublicUrlField';
import { TLSFieldset } from '@/react/components/TLSFieldset';
import { MetadataFieldset } from '@/react/portainer/environments/common/MetadataFieldset';
import {
  isAgentEnvironment,
  isLocalDockerEnvironment,
} from '@/react/portainer/environments/utils';
import {
  Environment,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';

import { FormSection } from '@@/form-components/FormSection';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget';
import { TLSConfig } from '@@/TLSFieldset/types';

import { EnvironmentFormActions } from '../EnvironmentFormActions/EnvironmentFormActions';

import { useGeneralValidation } from './validation';
import { buildInitialValues, buildUpdatePayload } from './helpers';

interface Props {
  environment: Environment;
  onSuccess: () => void;
}

export function GeneralEnvironmentForm({ environment, onSuccess }: Props) {
  const updateMutation = useUpdateEnvironmentMutation();

  const isAgent = isAgentEnvironment(environment.Type);
  const isLocalDocker = isLocalDockerEnvironment(environment.URL);
  const hasError = environment.Status === EnvironmentStatus.Error;
  const validationSchema = useGeneralValidation({
    status: environment.Status,
    environmentId: environment.Id,
  });

  return (
    <Widget>
      <WidgetBody>
        <Formik
          initialValues={buildInitialValues(environment)}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            const payload = buildUpdatePayload({
              values,
              environmentType: environment.Type,
            });
            updateMutation.mutate(
              { id: environment.Id, payload },
              { onSuccess }
            );
          }}
          validateOnMount
        >
          {({ values, setFieldValue, errors, isValid, dirty }) => (
            <Form className="form-horizontal">
              <FormSection title="Configuration">
                <NameField />

                {!hasError && (
                  <>
                    <EnvironmentUrlField
                      isAgent={isAgent}
                      disabled={isLocalDocker}
                    />
                    <PublicUrlField />
                  </>
                )}

                {!hasError && values.tls && (
                  <TLSFieldset
                    values={values.tls}
                    onChange={(partialValues) => {
                      setFieldValue('tls', {
                        ...values.tls,
                        ...partialValues,
                      });
                    }}
                    errors={errors.tls as FormikErrors<TLSConfig> | undefined}
                  />
                )}
              </FormSection>

              <MetadataFieldset />

              <EnvironmentFormActions
                isLoading={updateMutation.isLoading}
                isValid={isValid}
                isDirty={dirty}
              />
            </Form>
          )}
        </Formik>
      </WidgetBody>
    </Widget>
  );
}
