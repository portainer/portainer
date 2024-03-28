import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { DeployWidget } from '@/react/portainer/templates/components/DeployWidget';

import { ContainerDeployForm } from './ContainerDeployForm/ContainerDeployForm';
import { StackDeployForm } from './StackDeployForm/StackDeployForm';

export function DeployForm({
  template,
  unselect,
}: {
  template: TemplateViewModel;
  unselect: () => void;
}) {
  const Form = useForm(template);

  return (
    <DeployWidget
      logo={template.Logo}
      note={template.Note}
      title={template.Title}
    >
      <Form template={template} unselect={unselect} />
    </DeployWidget>
  );
}

function useForm(template: TemplateViewModel) {
  const envId = useEnvironmentId(false);

  if (!envId) {
    // for edge templates, return empty form
    return () => null;
  }

  if (template.Type === TemplateType.Container) {
    return ContainerDeployForm;
  }

  return StackDeployForm;
}
