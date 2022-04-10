import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';

interface Values {
  allowSelfSignedCertificates: boolean;
  envVars: string;
  edgeIdScript: string;
}

interface Props {
  setFieldValue<T>(key: string, value: T): void;
  values: Values;
}

export function EdgePropertiesForm({ setFieldValue, values }: Props) {
  return (
    <form className="form-horizontal">
      <FormSectionTitle>Edge script settings</FormSectionTitle>
      <FormControl
        label="Edge ID Getter"
        tooltip="A bash script one liner that will create the edge id"
        inputId="edge-id-getter-input"
      >
        <Input
          type="text"
          name="edgeIdScript"
          value={values.edgeIdScript}
          id="edge-id-getter-input"
          onChange={(e) => setFieldValue(e.target.name, e.target.value)}
        />
      </FormControl>

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.allowSelfSignedCertificates}
            label="Allow self-signed certificates"
            tooltip="When allowing self-signed certificates the edge agent will ignore the domain validation when connecting to Portainer via HTTPS"
            onChange={(checked) =>
              setFieldValue('allowSelfSignedCertificates', checked)
            }
          />
        </div>
      </div>

      <FormControl
        label="Environment variables"
        tooltip="Comma separated list of environment variables that will be sourced from the host where the agent is deployed."
        inputId="env-vars-input"
      >
        <Input
          type="text"
          name="edgeIdScript"
          value={values.envVars}
          id="env-vars-input"
          onChange={(e) => setFieldValue(e.target.name, e.target.value)}
        />
      </FormControl>
    </form>
  );
}
