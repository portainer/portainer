import { Button } from '@@/buttons';

import { TemplateItem } from '../components/TemplateItem';

import { TemplateViewModel } from './template';
import { TemplateType } from './types';

export function AppTemplatesListItem({
  template,
  onSelect,
  onDuplicate,
  isSelected,
}: {
  template: TemplateViewModel;
  onSelect: (template: TemplateViewModel) => void;
  onDuplicate: (template: TemplateViewModel) => void;
  isSelected: boolean;
}) {
  return (
    <TemplateItem
      template={template}
      typeLabel={
        template.Type === TemplateType.Container ? 'container' : 'stack'
      }
      onSelect={() => onSelect(template)}
      isSelected={isSelected}
      renderActions={
        template.Type === TemplateType.SwarmStack ||
        (template.Type === TemplateType.ComposeStack && (
          <div className="mr-5 mt-3">
            <Button
              size="xsmall"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(template);
              }}
            >
              Copy as Custom
            </Button>
          </div>
        ))
      }
    />
  );
}
