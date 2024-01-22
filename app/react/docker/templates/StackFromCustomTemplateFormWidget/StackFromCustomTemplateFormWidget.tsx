import { DeployWidget } from '@/react/portainer/templates/components/DeployWidget';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { useCustomTemplateFile } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';

import { TextTip } from '@@/Tip/TextTip';

import { useIsDeployable } from './useIsDeployable';
import { DeployForm } from './DeployForm';
import { TemplateLoadError } from './TemplateLoadError';

export function StackFromCustomTemplateFormWidget({
  template,
  unselect,
}: {
  template: CustomTemplate;
  unselect: () => void;
}) {
  const isDeployable = useIsDeployable(template.Type);
  const fileQuery = useCustomTemplateFile(template.Id);

  if (fileQuery.isLoading) {
    return null;
  }

  return (
    <DeployWidget
      logo={template.Logo}
      note={template.Note}
      title={template.Title}
    >
      {fileQuery.isError && (
        <TemplateLoadError
          creatorId={template.CreatedByUserId}
          templateId={template.Id}
        />
      )}

      {!isDeployable && (
        <div className="form-group">
          <div className="col-sm-12">
            <TextTip>
              This template type cannot be deployed on this environment.
            </TextTip>
          </div>
        </div>
      )}
      {fileQuery.isSuccess && isDeployable && (
        <DeployForm
          template={template}
          unselect={unselect}
          templateFile={fileQuery.data}
          isDeployable={isDeployable}
        />
      )}
    </DeployWidget>
  );
}
