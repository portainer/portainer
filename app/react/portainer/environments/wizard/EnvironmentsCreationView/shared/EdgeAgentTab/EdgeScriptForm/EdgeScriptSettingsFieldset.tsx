import { useFormikContext, Field } from 'formik';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';

import { NomadTokenField } from './NomadTokenField';
import { ScriptFormValues } from './types';

interface Props {
  isNomadTokenVisible?: boolean;
}

export function EdgeScriptSettingsFieldset({ isNomadTokenVisible }: Props) {
  const { values, setFieldValue } = useFormikContext<ScriptFormValues>();

  return (
    <>
      {isNomadTokenVisible && <NomadTokenField />}

      <FormControl
        label="Environment variables"
        tooltip="Comma separated list of environment variables that will be sourced from the host where the agent is deployed."
        inputId="env-variables-input"
      >
        <Field
          name="envVars"
          as={Input}
          placeholder="foo=bar,myvar"
          id="env-variables-input"
        />
      </FormControl>

      <div className="my-8">
        <SwitchField
          checked={values.allowSelfSignedCertificates}
          onChange={(value) =>
            setFieldValue('allowSelfSignedCertificates', value)
          }
          label="Allow self-signed certs"
          tooltip="When allowing self-signed certificates the edge agent will ignore the domain validation when connecting to Portainer via HTTPS"
        />
      </div>
    </>
  );
}
