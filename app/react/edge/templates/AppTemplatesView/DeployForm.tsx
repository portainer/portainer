import { Rocket } from 'lucide-react';
import { Form, Formik } from 'formik';
import { array, lazy, number, object, string } from 'yup';
import { useRouter } from '@uirouter/react';
import _ from 'lodash';

import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { EnvironmentType } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';
import { FallbackImage } from '@@/FallbackImage';
import { Icon } from '@@/Icon';
import { FormActions } from '@@/form-components/FormActions';
import { Button } from '@@/buttons';

import { EdgeGroupsSelector } from '../../edge-stacks/components/EdgeGroupsSelector';
import {
  NameField,
  nameValidation,
} from '../../edge-stacks/CreateView/NameField';
import { EdgeGroup } from '../../edge-groups/types';
import { DeploymentType, EdgeStack } from '../../edge-stacks/types';
import { useEdgeStacks } from '../../edge-stacks/queries/useEdgeStacks';
import { useEdgeGroups } from '../../edge-groups/queries/useEdgeGroups';
import { useCreateEdgeStackFromGit } from '../../edge-stacks/queries/useCreateEdgeStackFromGit';

import { EnvVarsFieldset } from './EnvVarsFieldset';

export function DeployFormWidget({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
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

interface FormValues {
  name: string;
  edgeGroupIds: Array<EdgeGroup['Id']>;
  envVars: Record<string, string>;
}

function DeployForm({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const router = useRouter();
  const mutation = useCreateEdgeStackFromGit();
  const edgeStacksQuery = useEdgeStacks();
  const edgeGroupsQuery = useEdgeGroups({
    select: (groups) =>
      Object.fromEntries(groups.map((g) => [g.Id, g.EndpointTypes])),
  });

  const initialValues: FormValues = {
    edgeGroupIds: [],
    name: template.Name || '',
    envVars:
      Object.fromEntries(template.Env?.map((env) => [env.name, env.value])) ||
      {},
  };

  if (!edgeStacksQuery.data || !edgeGroupsQuery.data) {
    return null;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={() =>
        validation(edgeStacksQuery.data, edgeGroupsQuery.data)
      }
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

          <EnvVarsFieldset
            value={values.envVars}
            options={template.Env}
            errors={errors.envVars}
            onChange={(values) => setFieldValue('envVars', values)}
          />

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
    return mutation.mutate(
      {
        name: values.name,
        edgeGroups: values.edgeGroupIds,
        deploymentType: DeploymentType.Compose,
        repositoryURL: template.Repository.url,
        filePathInRepository: template.Repository.stackfile,
        envVars: Object.entries(values.envVars).map(([name, value]) => ({
          name,
          value,
        })),
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

function validation(
  stacks: EdgeStack[],
  edgeGroupsType: Record<EdgeGroup['Id'], Array<EnvironmentType>>
) {
  return lazy((values: FormValues) => {
    const types = getTypes(values.edgeGroupIds);

    return object({
      name: nameValidation(
        stacks,
        types?.includes(EnvironmentType.EdgeAgentOnDocker)
      ),
      edgeGroupIds: array(number().required().default(0))
        .min(1, 'At least one group is required')
        .test(
          'same-type',
          'Groups should be of the same type',
          (value) => _.uniq(getTypes(value)).length === 1
        ),
      envVars: array()
        .transform((_, orig) => Object.values(orig))
        .of(string().required('Required')),
    });
  });

  function getTypes(value: number[] | undefined) {
    return value?.flatMap((g) => edgeGroupsType[g]);
  }
}
