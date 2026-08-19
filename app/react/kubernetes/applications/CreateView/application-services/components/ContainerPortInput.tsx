import { ChangeEvent } from 'react';

import { InputGroup } from '@@/form-components/InputGroup';

type Props = {
  serviceIndex: number;
  portIndex: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value?: number;
};

export function ContainerPortInput({
  serviceIndex,
  portIndex,
  value,
  onChange,
}: Props) {
  return (
    <InputGroup size="small">
      <InputGroup.Addon required>Container port</InputGroup.Addon>
      <InputGroup.Input
        type="number"
        className="form-control min-w-max"
        name={`container_port_${portIndex}`}
        placeholder="e.g. 80"
        min="1"
        max="65535"
        value={value ?? ''}
        onChange={onChange}
        required
        data-cy={`k8sAppCreate-containerPort-${serviceIndex}-${portIndex}`}
      />
    </InputGroup>
  );
}
