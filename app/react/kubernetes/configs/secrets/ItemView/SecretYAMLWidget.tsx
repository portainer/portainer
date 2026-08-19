import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Widget, WidgetBody } from '@@/Widget';

import { YAMLInspector } from '../../../components/YAMLInspector';
import { useSecretYAML } from '../queries/useSecretYAML';

type Props = {
  name: string;
  namespace: string;
};

export function SecretYAMLWidget({ name, namespace }: Props) {
  const environmentId = useEnvironmentId();
  const {
    data = '',
    isLoading,
    isError,
  } = useSecretYAML(environmentId, namespace, name);

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <YAMLInspector
              identifier={`secret-${namespace}-${name}`}
              data={data}
              isLoading={isLoading}
              isError={isError}
              data-cy="k8sConfigDetail-yamlInspector"
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
