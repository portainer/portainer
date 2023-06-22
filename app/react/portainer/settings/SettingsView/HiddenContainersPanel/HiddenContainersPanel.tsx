import { Box } from 'lucide-react';

import { TextTip } from '@@/Tip/TextTip';
import { Widget } from '@@/Widget';

import { useSettings } from '../../queries';

import { AddLabelForm } from './AddLabelForm';

export function HiddenContainersPanel() {
  const settingsQuery = useSettings((settings) => settings.BlackListedLabels);
  if (!settingsQuery.data) {
    return null;
  }

  const labels = settingsQuery.data;
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Title icon={Box} title="Hidden containers" />
          <Widget.Body>
            <div className="mb-3">
              <TextTip color="blue">
                You can hide containers with specific labels from Portainer UI.
                You need to specify the label name and value.
              </TextTip>
            </div>

            <AddLabelForm existingLabels={labels} />

            {/* <HiddenContainersTable labels={labels} /> */}
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}

// function HiddenContainersTable() {
//   return null;
// }
