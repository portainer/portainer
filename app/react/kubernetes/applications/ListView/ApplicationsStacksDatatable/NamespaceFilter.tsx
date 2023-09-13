import { Filter } from 'lucide-react';
import { useEffect } from 'react';

import { Icon } from '@@/Icon';
import { Select } from '@@/form-components/Input';
import { InputGroup } from '@@/form-components/InputGroup';

import { Namespace } from './types';

function transformNamespaces(namespaces: Namespace[], showSystem: boolean) {
  return namespaces
    .filter((ns) => showSystem || !ns.IsSystem)
    .map(({ Name, IsSystem }) => ({
      label: IsSystem ? `${Name} - system` : Name,
      value: Name,
    }));
}

export function NamespaceFilter({
  namespaces,
  value,
  onChange,
  showSystem,
}: {
  namespaces: Namespace[];
  value: string;
  onChange: (value: string) => void;
  showSystem: boolean;
}) {
  const transformedNamespaces = transformNamespaces(namespaces, showSystem);

  // sync value with displayed namespaces
  useEffect(() => {
    const names = transformedNamespaces.map((ns) => ns.value);
    if (value && !names.find((ns) => ns === value)) {
      onChange(
        names.length > 0 ? names.find((ns) => ns === 'default') || names[0] : ''
      );
    }
  }, [value, onChange, transformedNamespaces]);

  return (
    <InputGroup>
      <InputGroup.Addon>
        <div className="flex items-center gap-1">
          <Icon icon={Filter} />
          Namespace
        </div>
      </InputGroup.Addon>
      <Select
        className="!h-[30px] py-1"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { label: 'All namespaces', value: '' },
          ...transformedNamespaces,
        ]}
      />
    </InputGroup>
  );
}
