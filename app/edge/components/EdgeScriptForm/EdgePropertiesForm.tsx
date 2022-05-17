import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';
import { TextTip } from '@/portainer/components/Tip/TextTip';

import { OsSelector } from './OsSelector';
import { EdgeProperties } from './types';

interface Props {
  setFieldValue<T>(key: string, value: T): void;
  values: EdgeProperties;
  hideIdGetter: boolean;
}

export function EdgePropertiesForm({
  setFieldValue,
  values,
  hideIdGetter,
}: Props) {
  return (
    <form className="form-horizontal">
      <FormSectionTitle>Edge agent deployment script</FormSectionTitle>

      <OsSelector
        value={values.os}
        onChange={(os) => setFieldValue('os', os)}
      />

      {!hideIdGetter && (
        <>
          <FormControl
            label="Edge ID Generator"
            tooltip="A bash script one liner that will generate the edge id and will be assigned to the PORTAINER_EDGE_ID environment variable"
            inputId="edge-id-generator-input"
          >
            <Input
              type="text"
              name="edgeIdGenerator"
              value={values.edgeIdGenerator}
              id="edge-id-generator-input"
              onChange={(e) => setFieldValue(e.target.name, e.target.value)}
            />
          </FormControl>

          <TextTip color="blue">
            <code>PORTAINER_EDGE_ID</code> environment variable is required to
            successfully connect the edge agent to Portainer
          </TextTip>
        </>
      )}

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
          name="envVars"
          value={values.envVars}
          id="env-vars-input"
          onChange={(e) => setFieldValue(e.target.name, e.target.value)}
        />
      </FormControl>
    </form>
  );
}
