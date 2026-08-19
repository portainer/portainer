import { DeployWidget } from '@/react/portainer/templates/components/DeployWidget';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { useCustomTemplateFile } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplateFile';
import { useCustomTemplate } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplate';

import { TextTip } from '@@/Tip/TextTip';

import { useIsDeployable } from './useIsDeployable';
import { DeployForm } from './DeployForm';
import { TemplateLoadError } from './TemplateLoadError';

export function StackFromCustomTemplateFormWidget({
  templateId,
}: {
  templateId: CustomTemplate['Id'];
}) {
  const templateQuery = useCustomTemplate(templateId);

  const isDeployable = useIsDeployable(templateQuery.data?.Type);
  const fileQuery = useCustomTemplateFile(templateId);

  if (fileQuery.isLoading || !templateQuery.data) {
    return null;
  }

  const template = templateQuery.data;

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
          templateFile={fileQuery.data}
          isDeployable={isDeployable}
        />
      )}
    </DeployWidget>
  );
}
