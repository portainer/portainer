import { Form, FormikProps } from 'formik';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

import { useEnvironment } from '@/react/portainer/environments/queries';
import { useGroup } from '@/react/portainer/environments/environment-groups/queries';
import { useUsers } from '@/portainer/users/queries';
import { useTeams } from '@/react/portainer/users/teams/queries/useTeams';
import { User } from '@/portainer/users/types';
import { Environment } from '@/react/portainer/environments/types';
import { Team } from '@/react/portainer/users/teams/types';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { Link } from '@@/Link';

import { NamespaceAccessUsersSelector } from '../NamespaceAccessUsersSelector';
import { EnvironmentAccess, NamespaceAccess } from '../types';

import { CreateAccessValues } from './types';

export function CreateAccessInnerForm({
  values,
  handleSubmit,
  setFieldValue,
  isSubmitting,
  isValid,
  dirty,
  namespaceAccessesGranted,
}: FormikProps<CreateAccessValues> & {
  namespaceAccessesGranted: NamespaceAccess[];
}) {
  const environmentId = useEnvironmentId();
  const environmentQuery = useEnvironment(environmentId);
  const groupQuery = useGroup(environmentQuery.data?.GroupId);
  const usersQuery = useUsers(false, environmentId);
  const teamsQuery = useTeams();
  const availableTeamOrUserOptions: EnvironmentAccess[] =
    useAvailableTeamOrUserOptions(
      values.selectedUsersAndTeams,
      namespaceAccessesGranted,
      environmentQuery.data,
      groupQuery.data,
      usersQuery.data,
      teamsQuery.data
    );
  const isAdminQuery = useIsEdgeAdmin();
  return (
    <Form className="form-horizontal" onSubmit={handleSubmit} noValidate>
      <FormControl label="Select user(s) and/or team(s)">
        {availableTeamOrUserOptions.length > 0 ||
        values.selectedUsersAndTeams.length > 0 ? (
          <NamespaceAccessUsersSelector
            inputId="users-selector"
            options={availableTeamOrUserOptions}
            onChange={(opts) => setFieldValue('selectedUsersAndTeams', opts)}
            value={values.selectedUsersAndTeams}
            dataCy="namespaceAccess-usersSelector"
          />
        ) : (
          <span className="small text-muted pt-2">
            No user or team access has been set on the environment.
            {isAdminQuery.isAdmin && (
              <>
                {' '}
                Head over to the{' '}
                <Link
                  to="portainer.endpoints"
                  data-cy="namespaceAccess-environmentsLink"
                >
                  Environments view
                </Link>{' '}
                to manage them.
              </>
            )}
          </span>
        )}
      </FormControl>
      <div className="form-group mt-5">
        <div className="col-sm-12">
          <LoadingButton
            disabled={!isValid || !dirty}
            data-cy="namespaceAccess-createAccessButton"
            isLoading={isSubmitting}
            loadingText="Creating access..."
            icon={Plus}
            className="!ml-0"
          >
            Create access
          </LoadingButton>
        </div>
      </div>
    </Form>
  );
}

/**
 * Returns the team and user options that can be added to the namespace, excluding the ones that already have access.
 */
function useAvailableTeamOrUserOptions(
  selectedAccesses: EnvironmentAccess[],
  namespaceAccessesGranted: NamespaceAccess[],
  environment?: Environment,
  group?: EnvironmentGroup,
  users?: User[],
  teams?: Team[]
) {
  return useMemo(() => {
    // get unique users and teams from environment accesses (the keys are the IDs)
    const environmentAccessPolicies = environment?.UserAccessPolicies ?? {};
    const environmentTeamAccessPolicies = environment?.TeamAccessPolicies ?? {};
    const environmentGroupAccessPolicies = group?.UserAccessPolicies ?? {};
    const environmentGroupTeamAccessPolicies = group?.TeamAccessPolicies ?? {};

    // get all users that have access to the environment
    const userAccessPolicies = {
      ...environmentAccessPolicies,
      ...environmentGroupAccessPolicies,
    };
    const uniqueUserIds = new Set(Object.keys(userAccessPolicies));
    const userAccessOptions: EnvironmentAccess[] = Array.from(uniqueUserIds)
      .map((id) => {
        const userId = parseInt(id, 10);
        const user = users?.find((u) => u.Id === userId);
        if (!user) {
          return null;
        }
        // role from the userAccessPolicies is used by default, if not found, role from the environmentTeamAccessPolicies is used
        const userAccessPolicy =
          environmentAccessPolicies[userId] ??
          environmentGroupAccessPolicies[userId];
        const userAccess: EnvironmentAccess = {
          id: user?.Id,
          name: user?.Username,
          type: 'user',
          role: {
            name: 'Standard user',
            id: userAccessPolicy?.RoleId,
          },
        };
        return userAccess;
      })
      .filter((u) => u !== null);

    // get all teams that have access to the environment
    const teamAccessPolicies = {
      ...environmentTeamAccessPolicies,
      ...environmentGroupTeamAccessPolicies,
    };
    const uniqueTeamIds = new Set(Object.keys(teamAccessPolicies));
    const teamAccessOptions: EnvironmentAccess[] = Array.from(uniqueTeamIds)
      .map((id) => {
        const teamId = parseInt(id, 10);
        const team = teams?.find((t) => t.Id === teamId);
        if (!team) {
          return null;
        }
        const teamAccessPolicy =
          environmentTeamAccessPolicies[teamId] ??
          environmentGroupTeamAccessPolicies[teamId];
        const teamAccess: EnvironmentAccess = {
          id: team?.Id,
          name: team?.Name,
          type: 'team',
          role: {
            name: 'Standard user',
            id: teamAccessPolicy?.RoleId,
          },
        };
        return teamAccess;
      })
      .filter((t) => t !== null);

    // filter out users and teams that already have access to the namespace
    const userAndTeamEnvironmentAccesses = [
      ...userAccessOptions,
      ...teamAccessOptions,
    ];
    const filteredAccessOptions = userAndTeamEnvironmentAccesses.filter(
      (t) =>
        !selectedAccesses.some((e) => e.id === t.id && e.type === t.type) &&
        !namespaceAccessesGranted.some(
          (e) => e.id === t.id && e.type === t.type
        )
    );

    return filteredAccessOptions;
  }, [
    namespaceAccessesGranted,
    selectedAccesses,
    environment,
    group,
    users,
    teams,
  ]);
}
