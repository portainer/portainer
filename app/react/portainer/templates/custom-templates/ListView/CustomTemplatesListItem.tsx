import { Edit, Trash2 } from 'lucide-react';

import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { StackType } from '@/react/common/stacks/types';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { TemplateItem } from '../../components/TemplateItem';

export function CustomTemplatesListItem({
  template,
  onSelect,
  onDelete,
  isSelected,
  linkParams,
}: {
  template: CustomTemplate;
  onSelect?: (templateId: CustomTemplate['Id']) => void;
  onDelete: (templateId: CustomTemplate['Id']) => void;
  isSelected: boolean;
  linkParams?: { to: string; params: object };
}) {
  const { user } = useCurrentUser();
  const isAdminQuery = useIsEdgeAdmin();

  if (isAdminQuery.isLoading) {
    return null;
  }

  const isEditAllowed =
    isAdminQuery.isAdmin || template.CreatedByUserId === user.Id;

  return (
    <TemplateItem
      template={template}
      typeLabel={getTypeLabel(template.Type)}
      onSelect={() => onSelect?.(template.Id)}
      isSelected={isSelected}
      linkParams={linkParams}
      renderActions={
        <div className="mr-4 mt-3">
          {isEditAllowed && (
            <div className="vertical-center">
              <Button
                as={Link}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                color="secondary"
                props={{
                  to: '.edit',
                  params: {
                    id: template.Id,
                  },
                }}
                icon={Edit}
                data-cy={`custom-templates-edit-button-${template.Id}`}
              >
                Edit
              </Button>
              <Button
                data-cy="custom-templates-delete-"
                onClick={(e) => {
                  onDelete(template.Id);
                  e.stopPropagation();
                }}
                color="dangerlight"
                icon={Trash2}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      }
    />
  );
}

function getTypeLabel(type: StackType) {
  switch (type) {
    case StackType.DockerSwarm:
      return 'swarm';
    case StackType.Kubernetes:
      return 'manifest';
    case StackType.DockerCompose:
    default:
      return 'standalone';
  }
}
