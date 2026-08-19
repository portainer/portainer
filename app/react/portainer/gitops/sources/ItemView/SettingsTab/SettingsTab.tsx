import { SourceDetail } from '../../queries/useSource';

import { ConnectionDetailsWidget } from './ConnectionDetailsWidget';
import { AuthWidget } from './AuthWidget';
import { PollingWidget } from './PollingWidget';
import { SyncStatusWidget } from './SyncStatusWidget';
import { SettingsForm } from './EditForm/SettingsForm';

interface Props {
  source: SourceDetail;
  isEditing: boolean;
  onEditingChange: (isEditing: boolean) => void;
}

export function SettingsTab({ source, isEditing, onEditingChange }: Props) {
  if (isEditing) {
    return (
      <SettingsForm source={source} onCancel={() => onEditingChange(false)} />
    );
  }

  return (
    <>
      <ConnectionDetailsWidget source={source} />
      <AuthWidget auth={source?.connection.authentication} />
      <PollingWidget interval={source.interval} />
      <SyncStatusWidget source={source} />
    </>
  );
}
