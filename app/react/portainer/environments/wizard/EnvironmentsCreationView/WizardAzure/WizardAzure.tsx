import { Field, Form, Formik } from 'formik';
import { useReducer, useState } from 'react';
import { object, SchemaOf, string } from 'yup';
import { Network, Plug2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useCreateAzureEnvironmentMutation } from '@/react/portainer/environments/queries/useCreateEnvironmentMutation';
import { notifySuccess } from '@/portainer/services/notifications';
import { Environment } from '@/react/portainer/environments/types';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';
import {
  NameField,
  useNameValidation,
} from '@/react/portainer/environments/common/NameField/NameField';
import { metadataValidation } from '@/react/portainer/environments/common/MetadataFieldset/validation';

import { LoadingButton } from '@@/buttons/LoadingButton';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';
import { BadgeIcon } from '@@/BadgeIcon';

import { AnalyticsStateKey } from '../types';
import { MoreSettingsSection } from '../shared/MoreSettingsSection';

interface FormValues {
  name: string;
  applicationId: string;
  tenantId: string;
  authenticationKey: string;
  meta: EnvironmentMetadata;
}

const initialValues: FormValues = {
  name: '',
  applicationId: '',
  tenantId: '',
  authenticationKey: '',
  meta: {
    groupId: 1,
    tagIds: [],
  },
};

interface Props {
  onCreate(environment: Environment, analytics: AnalyticsStateKey): void;
}

export function WizardAzure({ onCreate }: Props) {
  const { t } = useTranslation();
  const [formKey, clearForm] = useReducer((state) => state + 1, 0);

  const options: Array<BoxSelectorOption<'api'>> = [
    {
      description: '',
      icon: <BadgeIcon icon={Network} size="3xl" />,
      id: 'api',
      label: t('wizard_env.azure.api'),
      value: 'api',
    },
  ];

  const [creationType, setCreationType] = useState(options[0].id);
  const mutation = useCreateAzureEnvironmentMutation();
  const validation = useValidation();

  return (
    <div className="form-horizontal">
      <BoxSelector
        options={options}
        radioName="creation-type"
        onChange={(value) => setCreationType(value)}
        value={creationType}
      />

      <Formik<FormValues>
        initialValues={initialValues}
        onSubmit={handleSubmit}
        key={formKey}
        validateOnMount
        validationSchema={validation}
      >
        {({ errors, dirty, isValid }) => (
          <Form>
            <NameField />

            <FormControl
              label={t('wizard_env.azure.application_id')}
              errors={errors.applicationId}
              inputId="applicationId-input"
              required
            >
              <Field
                name="applicationId"
                id="applicationId-input"
                as={Input}
                placeholder={t('wizard_env.azure.application_id_placeholder')}
              />
            </FormControl>

            <FormControl
              label={t('wizard_env.azure.tenant_id')}
              errors={errors.tenantId}
              inputId="tenantId-input"
              required
            >
              <Field
                name="tenantId"
                id="tenantId-input"
                as={Input}
                placeholder={t('wizard_env.azure.application_id_placeholder')}
              />
            </FormControl>

            <FormControl
              label={t('wizard_env.azure.auth_key')}
              errors={errors.authenticationKey}
              inputId="authenticationKey-input"
              required
            >
              <Field
                name="authenticationKey"
                id="authenticationKey-input"
                as={Input}
                placeholder={t('wizard_env.azure.auth_key_placeholder')}
              />
            </FormControl>

            <MoreSettingsSection />

            <div className="row">
              <div className="col-sm-12">
                <LoadingButton
                  className="vertical-center"
                  data-cy="create-azure-environment-button"
                  loadingText={t('wizard_env.connecting')}
                  isLoading={mutation.isLoading}
                  disabled={!dirty || !isValid}
                  icon={Plug2}
                >
                  {t('wizard_env.connect')}
                </LoadingButton>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );

  function handleSubmit({
    applicationId,
    authenticationKey,
    meta,
    name,
    tenantId,
  }: typeof initialValues) {
    mutation.mutate(
      {
        name,
        azure: {
          applicationId,
          authenticationKey,
          tenantId,
        },
        meta,
      },
      {
        onSuccess(environment) {
          notifySuccess(t('wizard_env.env_created'), environment.Name);
          clearForm();
          onCreate(environment, 'aciApi');
        },
      }
    );
  }
}

function useValidation(): SchemaOf<FormValues> {
  const { t } = useTranslation();
  return object({
    name: useNameValidation(),
    applicationId: string().required(t('wizard_env.azure.application_id_required')),
    tenantId: string().required(t('wizard_env.azure.tenant_id_required')),
    authenticationKey: string().required(t('wizard_env.azure.auth_key_required')),
    meta: metadataValidation(),
  });
}
