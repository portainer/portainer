import { useFormikContext, Field } from 'formik';

import { GroupField } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/MetadataFieldset/GroupsField';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { TagSelector } from '@@/TagSelector';

import { EdgeGroupsSelector } from '../../edge-stacks/components/EdgeGroupsSelector';

import { NomadTokenField } from './NomadTokenField';
import { ScriptFormValues } from './types';

interface Props {
  isNomadTokenVisible?: boolean;
  hideIdGetter?: boolean;
  showMetaFields?: boolean;
}

export function EdgeScriptSettingsFieldset({
  isNomadTokenVisible,
  hideIdGetter,
  showMetaFields,
}: Props) {
  const { values, setFieldValue } = useFormikContext<ScriptFormValues>();

  return (
    <>
      {showMetaFields && (
        <>
          <GroupField name="group" />

          <EdgeGroupsSelector
            value={values.edgeGroupsIds}
            onChange={(value) => setFieldValue('edgeGroupsIds', value)}
            isGroupVisible={(group) => !group.Dynamic}
            horizontal
          />

          <TagSelector
            value={values.tagsIds}
            onChange={(value) => setFieldValue('tagsIds', value)}
          />
        </>
      )}

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
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue">
                <code>PORTAINER_EDGE_ID</code> environment variable is required
                to successfully connect the edge agent to Portainer
              </TextTip>
            </div>
          </div>
        </>
      )}

      {isNomadTokenVisible && (
        <>
          <NomadTokenField />

          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label="TLS"
                labelClass="col-sm-3 col-lg-2"
                checked={values.tlsEnabled}
                onChange={(checked) => setFieldValue('tlsEnabled', checked)}
              />
            </div>
          </div>
        </>
      )}

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

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.allowSelfSignedCertificates}
            onChange={(value) =>
              setFieldValue('allowSelfSignedCertificates', value)
            }
            label="Allow self-signed certs"
            labelClass="col-sm-3 col-lg-2"
            tooltip="When allowing self-signed certificates the edge agent will ignore the domain validation when connecting to Portainer via HTTPS"
          />
        </div>
      </div>
    </>
  );
}
