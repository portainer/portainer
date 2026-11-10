import { StackType } from '@/react/common/stacks/types';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { SwitchField } from '@@/form-components/SwitchField';
import { FormSection } from '@@/form-components/FormSection';

interface Props {
  stackType: StackType | undefined;
  checked: boolean;
  onChange: (value: boolean) => void;
  environmentId: EnvironmentId;
}

export function PruneField({
  stackType,
  checked,
  onChange,
  environmentId,
}: Props) {
  const apiVersion = useApiVersion(environmentId);

  if (
    (stackType !== StackType.DockerSwarm &&
      stackType !== StackType.DockerCompose) ||
    apiVersion < 1.27
  ) {
    return null;
  }

  return (
    <FormSection title="Options">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            name="prune"
            checked={checked}
            tooltip="Prune services that are no longer referenced."
            labelClass="col-sm-3 col-lg-2"
            label="Prune services"
            onChange={onChange}
            data-cy="stack-prune-services-switch"
          />
        </div>
      </div>
    </FormSection>
  );
}
