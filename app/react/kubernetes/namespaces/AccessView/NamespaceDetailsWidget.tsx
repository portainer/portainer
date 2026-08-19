import { Layers } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';

import { WidgetTitle, WidgetBody, Widget } from '@@/Widget';

export function NamespaceDetailsWidget() {
  const {
    params: { id: namespaceName },
  } = useCurrentStateAndParams();
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget aria-label="Namespace details">
          <WidgetTitle icon={Layers} title="Namespace" />
          <WidgetBody>
            <table className="table">
              <tbody>
                <tr>
                  <td>Name</td>
                  <td>{namespaceName}</td>
                </tr>
              </tbody>
            </table>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
