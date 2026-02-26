import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

interface Values {
  applicationId: string;
  tenantId: string;
  authenticationKey: string;
}

interface Props {
  values: Values;
  setValues: (values: Values) => void;
}

export function AzureEndpointConfigSection({ values, setValues }: Props) {
  return (
    <FormSection title="Azure configuration">
      <FormControl
        label="Application ID"
        inputId="azure-application-id"
        size="small"
      >
        <Input
          id="azure-application-id"
          value={values.applicationId}
          onChange={(e) =>
            setValues({
              ...values,
              applicationId: e.target.value,
            })
          }
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          data-cy="azure-credential-appid-input"
        />
      </FormControl>

      <FormControl label="Tenant ID" inputId="azure-tenant-id" size="small">
        <Input
          id="azure-tenant-id"
          value={values.tenantId}
          onChange={(e) =>
            setValues({
              ...values,
              tenantId: e.target.value,
            })
          }
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          data-cy="azure-credential-tenantid-input"
        />
      </FormControl>

      <FormControl
        label="Authentication key"
        inputId="azure-authentication-key"
        size="small"
      >
        <Input
          id="azure-authentication-key"
          value={values.authenticationKey}
          onChange={(e) =>
            setValues({
              ...values,
              authenticationKey: e.target.value,
            })
          }
          placeholder="cOrXoK/1D35w8YQ8nH1/8ZGwzz45JIYD5jxHKXEQknk="
          data-cy="azure-credential-authkey-input"
        />
      </FormControl>
    </FormSection>
  );
}
