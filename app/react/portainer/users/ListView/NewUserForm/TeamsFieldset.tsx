import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';

import { useCurrentUser } from '@/react/hooks/useUser';
import { usePublicSettings } from '@/react/portainer/settings/queries';

import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

import { useTeams } from '../../teams/queries';

import { AdminSwitch } from './AdminSwitch';
import { FormValues } from './FormValues';
import { TeamsField } from './TeamsField';

export function TeamsFieldset() {
  const { values } = useFormikContext<FormValues>();
  const { isPureAdmin } = useCurrentUser();
  const teamsQuery = useTeams(!isPureAdmin);
  const settingsQuery = usePublicSettings();
  if (!teamsQuery.data || !settingsQuery.data) {
    return null;
  }

  const { TeamSync: teamSync } = settingsQuery.data;

  return (
    <>
      {isPureAdmin && <AdminSwitch />}

      {!values.isAdmin && (
        <TeamsField teams={teamsQuery.data} disabled={teamSync} />
      )}

      {teamSync && <TeamSyncMessage />}

      {isPureAdmin && !values.isAdmin && values.teams.length === 0 && (
        <NoTeamSelected />
      )}
    </>
  );
}

function TeamSyncMessage() {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <TextTip color="orange">
          {t('users.team_sync_message')}
        </TextTip>
      </div>
    </div>
  );
}

function NoTeamSelected() {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <TextTip color="blue">
          {t('users.no_team_note')}
        </TextTip>
      </div>
    </div>
  );
}
