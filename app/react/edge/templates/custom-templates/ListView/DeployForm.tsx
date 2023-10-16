import { Rocket } from 'lucide-react';
import { Form, Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { EdgeGroupsSelector } from '@/react/edge/edge-stacks/components/EdgeGroupsSelector';
import { DeploymentType } from '@/react/edge/edge-stacks/types';
import { useCreateStackFromFileContent } from '@/react/edge/edge-stacks/queries/useCreateStackFromFileContent';
import { useCustomTemplateFile } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';
import {
  CustomTemplatesVariablesField,
  getVariablesFieldDefaultValues,
} from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { NameField } from '@/react/edge/edge-stacks/CreateView/NameField';
import { renderTemplate } from '@/react/portainer/custom-templates/components/utils';

import { Button } from '@@/buttons';
import { FormActions } from '@@/form-components/FormActions';
import { Icon } from '@@/Icon';
import { FallbackImage } from '@@/FallbackImage';
import { Widget } from '@@/Widget';
import { WebEditorForm } from '@@/WebEditorForm';

import { AdvancedSettings } from './AdvancedSettings';
import { TemplateLoadError } from './TemplateLoadError';
import { useValidation } from './useValidation';
import { FormValues } from './types';

export function DeployFormWidget({
  template,
  unselect,
}: {
  template?: CustomTemplate;
  unselect: () => void;
}) {
  if (!template) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Title
            icon={
              <FallbackImage
                src={template.Logo}
                fallbackIcon={<Icon icon={Rocket} />}
              />
            }
            title={template.Title}
          />
          <Widget.Body>
            <DeployForm template={template} unselect={unselect} />
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}

function DeployForm({
  template,
  unselect,
}: {
  template: CustomTemplate;
  unselect: () => void;
}) {
  const router = useRouter();
  const mutation = useCreateStackFromFileContent();
  const validation = useValidation(template.Variables);
  const isGit = !!template.GitConfig;
  const fileContentQuery = useCustomTemplateFile(template.Id, isGit);

  if (!fileContentQuery.data) {
    return null;
  }

  const initVariables = getVariablesFieldDefaultValues(template.Variables);

  const initialValues: FormValues = {
    edgeGroupIds: [],
    name: template.Title || '',
    variables: initVariables,
    fileContent: renderTemplate(
      fileContentQuery.data,
      initVariables,
      template.Variables
    ),
  };

  if (fileContentQuery.error) {
    return <TemplateLoadError template={template} />;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      {({ values, errors, setFieldValue, isValid }) => (
        <Form className="form-horizontal">
          <NameField
            value={values.name}
            onChange={(v) => setFieldValue('name', v)}
            errors={errors.name}
          />

          <EdgeGroupsSelector
            horizontal
            value={values.edgeGroupIds}
            error={errors.edgeGroupIds}
            onChange={(value) => setFieldValue('edgeGroupIds', value)}
            required
          />

          <CustomTemplatesVariablesField
            onChange={(value) => {
              setFieldValue('variables', value);
              setFieldValue(
                'fileContent',
                renderTemplate(fileContentQuery.data, value, template.Variables)
              );
            }}
            value={values.variables}
            errors={errors.variables}
            definitions={template.Variables}
          />

          <AdvancedSettings
            label={(isOpen) => getAdvancedLabel(isOpen, !isGit)}
          >
            <WebEditorForm
              id="custom-template-creation-editor"
              value={values.fileContent}
              onChange={(value) => setFieldValue('fileContent', value)}
              error={errors.fileContent}
              yaml
              placeholder="Define or paste the content of your docker compose file here"
              readonly={isGit}
            >
              <p>
                You can get more information about Compose file format in the
                <a
                  href="https://docs.docker.com/compose/compose-file/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {' '}
                  official documentation{' '}
                </a>
                .
              </p>
            </WebEditorForm>
          </AdvancedSettings>

          <FormActions
            isLoading={mutation.isLoading}
            isValid={isValid}
            loadingText="Deployment in progress..."
            submitLabel="Deploy the stack"
          >
            <Button type="reset" onClick={() => unselect()} color="default">
              Hide
            </Button>
          </FormActions>
        </Form>
      )}
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    if (!fileContentQuery.data) {
      throw new Error('File content not loaded');
    }

    return mutation.mutate(
      {
        name: values.name,
        edgeGroups: values.edgeGroupIds,
        deploymentType: DeploymentType.Compose,
        stackFileContent: fileContentQuery.data,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Edge Stack created');
          router.stateService.go('edge.stacks');
        },
      }
    );
  }
}

function getAdvancedLabel(isOpen: boolean, editable?: boolean): string {
  if (isOpen) {
    return editable ? 'Hide custom stack' : 'Hide stack';
  }
  return editable ? 'Customize stack' : 'View stack';
}
