import { StackType } from '@/react/common/stacks/types';

import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

const typeOptions = [
  { label: 'Swarm', value: StackType.DockerSwarm },
  { label: 'Standalone / Podman', value: StackType.DockerCompose },
];

export function TemplateTypeSelector({
  onChange,
  value,
}: {
  onChange: (type: StackType) => void;
  value: StackType;
}) {
  return (
    <FormControl label="Type" required inputId="template-type">
      <Select
        name="type"
        data-cy="custom-template-template-type"
        id="template-type"
        required
        options={typeOptions}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </FormControl>
  );
}
