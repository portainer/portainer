import { Select } from '@@/form-components/ReactSelect';

interface Filter {
  label?: string;
}

interface Props {
  options: string[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  value: string;
}

export function TemplateListDropdown({
  options,
  onChange,
  placeholder,
  value,
}: Props) {
  const filterOptions: Filter[] = options.map((value) => ({ label: value }));
  const filterValue: Filter | null = value ? { label: value } : null;

  return (
    <Select
      placeholder={placeholder}
      options={filterOptions}
      value={filterValue}
      isClearable
      onChange={(option) => onChange(option?.label ?? null)}
    />
  );
}
