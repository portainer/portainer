import { Box } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';

import { TextTip } from '@@/Tip/TextTip';
import { Widget } from '@@/Widget';

import { useSettings, useUpdateSettingsMutation } from '../../queries';
import { Pair } from '../../types';

import { AddLabelForm } from './AddLabelForm';
import { HiddenContainersTable } from './HiddenContainersTable';

export function HiddenContainersPanel() {
  const settingsQuery = useSettings((settings) => settings.BlackListedLabels);
  const mutation = useUpdateSettingsMutation();

  if (!settingsQuery.data) {
    return null;
  }

  const labels = settingsQuery.data;
  return (
    <Widget>
      <Widget.Title icon={Box} title="Hidden containers" />
      <Widget.Body>
        <div className="mb-3">
          <TextTip color="blue">
            You can hide containers with specific labels from Portainer UI. You
            need to specify the label name and value.
          </TextTip>
        </div>

        <AddLabelForm
          isLoading={mutation.isLoading}
          onSubmit={(name, value) => handleSubmit([...labels, { name, value }])}
        />

        <HiddenContainersTable
          labels={labels}
          isLoading={mutation.isLoading}
          onDelete={(name) =>
            handleSubmit(labels.filter((label) => label.name !== name))
          }
        />
      </Widget.Body>
    </Widget>
  );

  function handleSubmit(labels: Pair[]) {
    mutation.mutate(
      {
        BlackListedLabels: labels,
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Hidden container settings updated');
        },
      }
    );
  }
}
