import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';

import { Widget } from '@@/Widget';

import { Environment, EnvironmentType } from '../../types';
import { isAgentEnvironment, isEdgeEnvironment } from '../../utils';

import { AzureForm } from './AzureForm/AzureForm';
import { AgentForm } from './AgentForm/AgentForm';
import { EdgeForm } from './EdgeForm/EdgeForm';
import { OtherTypesForm } from './OtherTypesForm/OtherTypesForm';

export function UpdateForm({ environment }: { environment: Environment }) {
  const router = useRouter();
  const {
    params: { redirectTo },
  } = useCurrentStateAndParams();

  const Form = getForm(environment);

  return (
    <Widget>
      <Widget.Body>
        <Form
          environment={environment}
          onSuccessUpdate={(name: string) => {
            notifySuccess('Environment updated', name);
            router.stateService.go(redirectTo || '^');
          }}
        />
      </Widget.Body>
    </Widget>
  );
}

function getForm(environment: Environment) {
  const isEdge = isEdgeEnvironment(environment.Type);
  const isAgent = isAgentEnvironment(environment.Type);

  if (environment.Type === EnvironmentType.Azure) {
    return AzureForm;
  }

  if (isEdge) {
    return EdgeForm;
  }

  if (isAgent) {
    return AgentForm;
  }

  return OtherTypesForm;
}
