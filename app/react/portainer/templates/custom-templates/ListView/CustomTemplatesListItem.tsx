import { Edit, Trash2 } from 'lucide-react';

import { useCurrentUser } from '@/react/hooks/useUser';
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
  const { isAdmin, user } = useCurrentUser();
  const isEditAllowed = isAdmin || template.CreatedByUserId === user.Id;

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
                  e.preventDefault();
                  e.stopPropagation();
                }}
                color="secondary"
                props={{
                  to: '.edit',
                  params: {
                    templateId: template.Id,
                  },
                }}
                icon={Edit}
              >
                Edit
              </Button>
              <Button
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
