import { InlineLoader } from '@@/InlineLoader';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget';

import { YAMLInspector } from '../../../components/YAMLInspector';

import { useApplicationYAML } from './useApplicationYAML';

// the yaml currently has the yaml from the app, related services and horizontal pod autoscalers
// TODO: this could be extended to include other related resources like ingresses, etc.
export function ApplicationYAMLEditor() {
  const { fullApplicationYaml, isApplicationYAMLLoading } =
    useApplicationYAML();

  if (isApplicationYAMLLoading) {
    return (
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <InlineLoader>Loading application YAML...</InlineLoader>
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
              identifier="application-yaml"
              data={fullApplicationYaml}
              hideMessage
              data-cy="application-yaml"
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
