import { Edit, Trash2 } from 'lucide-react';

import { useCurrentUser } from '@/react/hooks/useUser';
import { StackType } from '@/react/common/stacks/types';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { CustomTemplate } from '../types';
import { TemplateItem } from '../components/TemplateItem';

export function CustomTemplatesListItem({
  template,
  onSelect,
  onDelete,
  isSelected,
}: {
  template: CustomTemplate;
  onSelect: (templateId: CustomTemplate['Id']) => void;
  onDelete: (templateId: CustomTemplate['Id']) => void;
  isSelected: boolean;
}) {
  const { isAdmin, user } = useCurrentUser();
  const isEditAllowed = isAdmin || template.CreatedByUserId === user.Id;

  return (
    <TemplateItem
      key={template.Id}
      template={template}
      typeLabel={getTypeLabel(template.Type)}
      onSelect={() => onSelect(template.Id)}
      isSelected={isSelected}
    >
      <div>
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
    </TemplateItem>
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
