import { useEffect } from 'react';
import { FormikErrors } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';
import { FormControl } from '@@/form-components/FormControl';

import { useApiVersion } from './queries/useApiVersion';
import { useAgentNodes } from './queries/useAgentNodes';

export function NodeSelector({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: FormikErrors<string>;
}) {
  const environmentId = useEnvironmentId();

  const apiVersionQuery = useApiVersion(environmentId);

  const nodesQuery = useAgentNodes<Array<Option<string>>>(
    environmentId,
    apiVersionQuery.data || 1,
    {
      select: (data) =>
        data.map((node) => ({ label: node.NodeName, value: node.NodeName })),
      enabled: apiVersionQuery.data !== undefined,
    }
  );

  useEffect(() => {
    if (nodesQuery.data && !value && nodesQuery.data.length > 0) {
      onChange(nodesQuery.data[0].value);
    }
  }, [nodesQuery.data, onChange, value]);

  return (
    <FormControl label="Node" inputId="node-selector" errors={error}>
      <PortainerSelect
        inputId="node-selector"
        value={value}
        onChange={onChange}
        options={nodesQuery.data || []}
        data-cy="docker-agent-node-selector"
      />
    </FormControl>
  );
}
