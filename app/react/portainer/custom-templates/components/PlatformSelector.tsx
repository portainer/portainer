import { FormControl } from '@@/form-components/FormControl';
import { Select } from '@@/form-components/Input';

import { Platform } from '../../templates/types';

const platformOptions = [
  { label: 'Linux', value: Platform.LINUX },
  { label: 'Windows', value: Platform.WINDOWS },
];

export function PlatformField({
  onChange,
  value,
}: {
  onChange: (platform: Platform) => void;
  value: Platform;
}) {
  return (
    <FormControl label="Platform" required inputId="template-platform">
      <Select
        name="platform"
        data-cy="custom-tempalte-platform-select"
        id="template-platform"
        required
        options={platformOptions}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
      />
    </FormControl>
  );
}
