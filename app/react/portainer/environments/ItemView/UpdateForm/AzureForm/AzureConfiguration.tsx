import { useFormikContext } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

export interface AzureFormValues {
  applicationId: string;
  tenantId: string;
  authKey: string;
}

export function AzureEnvironmentConfiguration() {
  const { errors, values, setFieldValue } = useFormikContext<AzureFormValues>();

  return (
    <FormSection title="Azure Configuration">
      <FormControl
        label="Application ID"
        inputId="azure_application_id"
        errors={errors?.applicationId}
      >
        <Input
          id="azure_application_id"
          name="azure.applicationId"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={values.applicationId}
          onChange={(e) => setFieldValue('applicationId', e.target.value)}
          data-cy="azure-credential-appid-input"
        />
      </FormControl>
      <FormControl
        label="Tenant ID"
        inputId="azure_tenant_id"
        errors={errors?.tenantId}
      >
        <Input
          id="azure_tenant_id"
          name="azure.tenantId"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={values.tenantId}
          onChange={(e) => setFieldValue('tenantId', e.target.value)}
          data-cy="azure-credential-tenantid-input"
        />
      </FormControl>
      <FormControl
        label="Authentication key"
        inputId="azure_auth_key"
        errors={errors?.authKey}
      >
        <Input
          id="azure_auth_key"
          name="azure.authKey"
          placeholder="cOrXoK/1D35w8YQ8nH1/8ZGwzz45JIYD5jxHKXEQknk="
          value={values.authKey}
          onChange={(e) => setFieldValue('authKey', e.target.value)}
          data-cy="azure-credential-authkey-input"
        />
      </FormControl>
    </FormSection>
  );
}
