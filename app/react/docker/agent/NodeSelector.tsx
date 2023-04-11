import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';
import { FormControl } from '@@/form-components/FormControl';

import { useApiVersion } from './queries/useApiVersion';
import { useAgentNodes } from './queries/useAgentNodes';

export function NodeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const environmentId = useEnvironmentId();

  const apiVersionQuery = useApiVersion(environmentId);

  const nodesQuery = useAgentNodes<Array<Option<string>>>(
    environmentId,
    apiVersionQuery.data || 1,
    {
      onSuccess(data) {
        if (!value && data.length > 0) {
          onChange(data[0].value);
        }
      },
      select: (data) =>
        data.map((node) => ({ label: node.NodeName, value: node.NodeName })),
      enabled: apiVersionQuery.data !== undefined,
    }
  );

  return (
    <FormControl label="Node" inputId="node-selector">
      <PortainerSelect
        inputId="node-selector"
        value={value}
        onChange={onChange}
        options={nodesQuery.data || []}
      />
    </FormControl>
  );
}
