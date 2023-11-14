import { StackType } from '@/react/common/stacks/types';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { TemplateItem } from '../components/TemplateItem';

import { TemplateViewModel } from './view-model';
import { TemplateType } from './types';

export function AppTemplatesListItem({
  template,
  onSelect,
  isSelected,
}: {
  template: TemplateViewModel;
  onSelect: (template: TemplateViewModel) => void;
  isSelected: boolean;
}) {
  const duplicateCustomTemplateType = getCustomTemplateType(template.Type);

  return (
    <TemplateItem
      template={template}
      typeLabel={
        template.Type === TemplateType.Container ? 'container' : 'stack'
      }
      onSelect={() => onSelect(template)}
      isSelected={isSelected}
      renderActions={
        duplicateCustomTemplateType && (
          <div className="mr-5 mt-3">
            <Button
              as={Link}
              size="xsmall"
              onClick={(e) => {
                e.stopPropagation();
              }}
              props={{
                to: '.custom.new',
                params: {
                  appTemplateId: template.Id,
                  type: duplicateCustomTemplateType,
                },
              }}
            >
              Copy as Custom
            </Button>
          </div>
        )
      }
    />
  );
}

function getCustomTemplateType(type: TemplateType): StackType | null {
  switch (type) {
    case TemplateType.SwarmStack:
      return StackType.DockerSwarm;
    case TemplateType.ComposeStack:
      return StackType.DockerCompose;
    default:
      return null;
  }
}
