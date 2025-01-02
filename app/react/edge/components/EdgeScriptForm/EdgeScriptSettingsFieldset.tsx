import { useFormikContext, Field } from 'formik';

import { GroupField } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/MetadataFieldset/GroupsField';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { TagSelector } from '@@/TagSelector';

import { EdgeGroupsSelector } from '../../edge-stacks/components/EdgeGroupsSelector';

import { ScriptFormValues } from './types';

interface Props {
  hideIdGetter?: boolean;
  showMetaFields?: boolean;
}

export function EdgeScriptSettingsFieldset({
  hideIdGetter,
  showMetaFields,
}: Props) {
  const { values, setFieldValue, errors } =
    useFormikContext<ScriptFormValues>();

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
            tooltip="Enter a single-line bash command that generates a unique Edge ID. For example, you can use 'uuidgen' or 'uuid'. The result will be assigned to the 'PORTAINER_EDGE_ID' environment variable."
            inputId="edge-id-generator-input"
            required
            errors={errors.edgeIdGenerator}
          >
            <Input
              type="text"
              value={values.edgeIdGenerator}
              name="edgeIdGenerator"
              placeholder="e.g. uuidgen"
              id="edge-id-generator-input"
              onChange={(e) => setFieldValue(e.target.name, e.target.value)}
              data-cy="edge-id-generator-input"
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

      <FormControl
        label="Environment variables"
        tooltip="Comma separated list of environment variables that will be sourced from the host where the agent is deployed."
        inputId="env-variables-input"
      >
        <Field
          name="envVars"
          as={Input}
          placeholder="e.g. foo=bar"
          id="env-variables-input"
        />
      </FormControl>

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.allowSelfSignedCertificates}
            data-cy="allow-self-signed-certs-switch"
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
