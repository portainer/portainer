import { useCurrentStateAndParams } from '@uirouter/react';

import { InlineLoader } from '@@/InlineLoader';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget';

import { YAMLInspector } from '../../components/YAMLInspector';
import { useNamespaceYAML } from '../queries/useNamespaceYAML';

export function NamespaceYAMLEditor() {
  const {
    params: { id: namespace, endpointId: environmentId },
  } = useCurrentStateAndParams();
  const { data: fullNamespaceYaml, isLoading: isNamespaceYAMLLoading } =
    useNamespaceYAML(environmentId, namespace);

  if (isNamespaceYAMLLoading) {
    return (
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <InlineLoader>Loading namespace YAML...</InlineLoader>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <YAMLInspector
              identifier="namespace-yaml"
              data={fullNamespaceYaml || ''}
              hideMessage
              data-cy="namespace-yaml"
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
