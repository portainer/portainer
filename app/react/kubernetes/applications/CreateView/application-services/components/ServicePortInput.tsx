import { ChangeEvent } from 'react';

import { InputGroup } from '@@/form-components/InputGroup';

type Props = {
  serviceIndex: number;
  portIndex: number;
  value?: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function ServicePortInput({
  serviceIndex,
  portIndex,
  value,
  onChange,
}: Props) {
  return (
    <InputGroup size="small">
      <InputGroup.Addon required>Service port</InputGroup.Addon>
      <InputGroup.Input
        type="number"
        className="form-control min-w-max"
        name={`service_port_${portIndex}`}
        placeholder="e.g. 80"
        min="1"
        max="65535"
        value={value ?? ''}
        onChange={onChange}
        required
        data-cy={`k8sAppCreate-servicePort-${serviceIndex}-${portIndex}`}
      />
    </InputGroup>
  );
}
