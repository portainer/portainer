import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import axios from '@/portainer/services/axios/axios';
import { parseKubernetesAxiosError } from '@/react/kubernetes/axiosError';

import { Widget, WidgetBody } from '@@/Widget';

import { YAMLInspector } from '../../../components/YAMLInspector';

export function ServiceAccountYAMLEditor() {
  const {
    params: { namespace, name },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();

  const {
    data = '',
    isLoading,
    isError,
  } = useQuery(
    [environmentId, 'kubernetes', 'serviceaccount-yaml', namespace, name],
    () => getServiceAccountYAML(environmentId, namespace, name),
    { enabled: !!namespace && !!name }
  );

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <YAMLInspector
              identifier={`serviceaccount-${namespace}-${name}`}
              data={data}
              isLoading={isLoading}
              isError={isError}
              data-cy="serviceaccount-yaml"
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}

async function getServiceAccountYAML(
  environmentId: number,
  namespace: string,
  name: string
) {
  try {
    const { data } = await axios.get<string>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/serviceaccounts/${name}`,
      { headers: { Accept: 'application/yaml' } }
    );
    return data;
  } catch (e) {
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve service account YAML'
    );
  }
}
