import { Select } from '@/portainer/components/form-components/ReactSelect';

interface Filter {
  label: string;
}

interface Props {
  options: string[];
  onChange: (filterOptions: string) => void;
  placeholder: string;
  value: Filter[];
}

export function TemplateListFilter({
  options,
  onChange,
  placeholder,
  value,
}: Props) {
  const filterOptions: Filter[] = options.map((value) => ({ label: value }));

  return (
    <Select
      placeholder={placeholder}
      options={filterOptions}
      value={value}
      isClearable
      onChange={(option) => onChange((option as Filter)?.label)}
    />
  );
}
