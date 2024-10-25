import { Filter } from 'lucide-react';
import { useEffect } from 'react';

import { PortainerNamespace } from '@/react/kubernetes/namespaces/types';

import { Icon } from '@@/Icon';
import { Select } from '@@/form-components/Input';
import { InputGroup } from '@@/form-components/InputGroup';

function transformNamespaces(
  namespaces: PortainerNamespace[],
  showSystem?: boolean
) {
  const transformedNamespaces = namespaces.map(({ Name, IsSystem }) => ({
    label: IsSystem ? `${Name} - system` : Name,
    value: Name,
    isSystem: IsSystem,
  }));
  if (showSystem === undefined) {
    return transformedNamespaces;
  }
  // only filter when showSystem is set
  return transformedNamespaces.filter((ns) => showSystem || !ns.isSystem);
}

export function NamespaceFilter({
  namespaces,
  value,
  onChange,
  showSystem,
}: {
  namespaces: PortainerNamespace[];
  value: string;
  onChange: (value: string) => void;
  showSystem?: boolean;
}) {
  const transformedNamespaces = transformNamespaces(namespaces, showSystem);

  // sync value with displayed namespaces
  useEffect(() => {
    const names = transformedNamespaces.map((ns) => ns.value);
    const isSelectedNamespaceFound = names.some((ns) => ns === value);
    if (value && !isSelectedNamespaceFound) {
      const newNamespaceValue =
        names.length > 0
          ? names.find((ns) => ns === 'default') || names[0]
          : '';
      onChange(newNamespaceValue);
    }
  }, [value, onChange, transformedNamespaces, showSystem]);

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
        data-cy="app-stacks-namespace-filter"
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
