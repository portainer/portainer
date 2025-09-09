import { WidgetBody, Widget } from '@@/Widget';

import { YAMLInspector } from '../../components/YAMLInspector';
import { useNodeQuery } from '../queries/useNodeQuery';

export function NodeYamlInspector({
  environmentId,
  nodeName,
}: {
  environmentId: number;
  nodeName: string;
}) {
  const nodeYamlQuery = useNodeQuery<string>(environmentId, nodeName, {
    isYaml: true,
  });
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <YAMLInspector
              identifier="node-yaml"
              data={nodeYamlQuery.data || ''}
              data-cy="node-yaml"
              isLoading={nodeYamlQuery.isInitialLoading}
              isError={nodeYamlQuery.isError}
              hideMessage
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
