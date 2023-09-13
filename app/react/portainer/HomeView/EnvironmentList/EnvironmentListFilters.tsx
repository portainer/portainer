import _ from 'lodash';

import { useTags } from '@/portainer/tags/queries';

import { useAgentVersionsList } from '../../environments/queries/useAgentVersionsList';
import { EnvironmentStatus, PlatformType } from '../../environments/types';
import { isBE } from '../../feature-flags/feature-flags.service';
import { useGroups } from '../../environments/environment-groups/queries';
import {
  SortOptions,
  SortType,
} from '../../environments/queries/useEnvironmentList';

import { HomepageFilter } from './HomepageFilter';
import { SortbySelector } from './SortbySelector';
import { ConnectionType } from './types';
import styles from './EnvironmentList.module.css';

const status = [
  { value: EnvironmentStatus.Up, label: 'Up' },
  { value: EnvironmentStatus.Down, label: 'Down' },
];

const sortByOptions = SortOptions.map((v) => ({
  value: v,
  label: v,
}));

export function EnvironmentListFilters({
  agentVersions,
  clearFilter,
  connectionTypes,
  groupOnChange,
  groupState,
  platformTypes,
  setAgentVersions,
  setConnectionTypes,
  setPlatformTypes,
  sortByButton,
  sortByDescending,
  sortByState,
  sortOnDescending,
  sortOnChange,
  statusOnChange,
  statusState,
  tagOnChange,
  tagState,
}: {
  platformTypes: PlatformType[];
  setPlatformTypes: (value: PlatformType[]) => void;

  connectionTypes: ConnectionType[];
  setConnectionTypes: (value: ConnectionType[]) => void;

  statusState: number[];
  statusOnChange: (value: number[]) => void;

  tagOnChange: (value: number[]) => void;
  tagState: number[];

  groupOnChange: (value: number[]) => void;
  groupState: number[];

  setAgentVersions: (value: string[]) => void;
  agentVersions: string[];

  sortByState?: SortType;
  sortOnChange: (value: SortType) => void;

  sortOnDescending: () => void;
  sortByDescending: boolean;

  sortByButton: boolean;

  clearFilter: () => void;
}) {
  const agentVersionsQuery = useAgentVersionsList();
  const connectionTypeOptions = getConnectionTypeOptions(platformTypes);
  const platformTypeOptions = getPlatformTypeOptions(connectionTypes);

  const groupsQuery = useGroups();
  const groupOptions = [...(groupsQuery.data || [])];
  const uniqueGroup = [
    ...new Map(groupOptions.map((item) => [item.Id, item])).values(),
  ].map(({ Id: value, Name: label }) => ({
    value,
    label,
  }));

  const tagsQuery = useTags();
  const tagOptions = [...(tagsQuery.data || [])];
  const uniqueTag = [
    ...new Map(tagOptions.map((item) => [item.ID, item])).values(),
  ].map(({ ID: value, Name: label }) => ({
    value,
    label,
  }));

  return (
    <div className="flex gap-2">
      <div className={styles.filterLeft}>
        <HomepageFilter
          filterOptions={platformTypeOptions}
          onChange={setPlatformTypes}
          placeHolder="Platform"
          value={platformTypes}
        />
      </div>
      <div className={styles.filterLeft}>
        <HomepageFilter
          filterOptions={connectionTypeOptions}
          onChange={setConnectionTypes}
          placeHolder="Connection Type"
          value={connectionTypes}
        />
      </div>
      <div className={styles.filterLeft}>
        <HomepageFilter
          filterOptions={status}
          onChange={statusOnChange}
          placeHolder="Status"
          value={statusState}
        />
      </div>
      <div className={styles.filterLeft}>
        <HomepageFilter
          filterOptions={uniqueTag}
          onChange={tagOnChange}
          placeHolder="Tags"
          value={tagState}
        />
      </div>
      <div className={styles.filterLeft}>
        <HomepageFilter
          filterOptions={uniqueGroup}
          onChange={groupOnChange}
          placeHolder="Groups"
          value={groupState}
        />
      </div>
      <div className={styles.filterLeft}>
        <HomepageFilter
          filterOptions={
            agentVersionsQuery.data?.map((v) => ({
              label: v,
              value: v,
            })) || []
          }
          onChange={setAgentVersions}
          placeHolder="Agent Version"
          value={agentVersions}
        />
      </div>
      <button
        type="button"
        className={styles.clearButton}
        onClick={clearFilter}
      >
        Clear all
      </button>

      <div className={styles.filterRight}>
        <SortbySelector
          filterOptions={sortByOptions}
          onChange={sortOnChange}
          onDescending={sortOnDescending}
          placeHolder="Sort By"
          sortByDescending={sortByDescending}
          sortByButton={sortByButton}
          value={sortByState}
        />
      </div>
    </div>
  );
}

function getConnectionTypeOptions(platformTypes: PlatformType[]) {
  const platformTypeConnectionType = {
    [PlatformType.Docker]: [
      ConnectionType.API,
      ConnectionType.Agent,
      ConnectionType.EdgeAgentStandard,
      ConnectionType.EdgeAgentAsync,
    ],
    [PlatformType.Azure]: [ConnectionType.API],
    [PlatformType.Kubernetes]: [
      ConnectionType.Agent,
      ConnectionType.EdgeAgentStandard,
      ConnectionType.EdgeAgentAsync,
    ],
    [PlatformType.Nomad]: [
      ConnectionType.EdgeAgentStandard,
      ConnectionType.EdgeAgentAsync,
    ],
  };

  const connectionTypesDefaultOptions = [
    { value: ConnectionType.API, label: 'API' },
    { value: ConnectionType.Agent, label: 'Agent' },
    { value: ConnectionType.EdgeAgentStandard, label: 'Edge Agent Standard' },
    { value: ConnectionType.EdgeAgentAsync, label: 'Edge Agent Async' },
  ];

  if (platformTypes.length === 0) {
    return connectionTypesDefaultOptions;
  }

  return _.compact(
    _.intersection(
      ...platformTypes.map((p) => platformTypeConnectionType[p])
    ).map((c) => connectionTypesDefaultOptions.find((o) => o.value === c))
  );
}

function getPlatformTypeOptions(connectionTypes: ConnectionType[]) {
  const platformDefaultOptions = [
    { value: PlatformType.Docker, label: 'Docker' },
    { value: PlatformType.Azure, label: 'Azure' },
    { value: PlatformType.Kubernetes, label: 'Kubernetes' },
  ];

  if (isBE) {
    platformDefaultOptions.push({
      value: PlatformType.Nomad,
      label: 'Nomad',
    });
  }

  if (connectionTypes.length === 0) {
    return platformDefaultOptions;
  }

  const connectionTypePlatformType = {
    [ConnectionType.API]: [PlatformType.Docker, PlatformType.Azure],
    [ConnectionType.Agent]: [PlatformType.Docker, PlatformType.Kubernetes],
    [ConnectionType.EdgeAgentStandard]: [
      PlatformType.Kubernetes,
      PlatformType.Nomad,
      PlatformType.Docker,
    ],
    [ConnectionType.EdgeAgentAsync]: [
      PlatformType.Nomad,
      PlatformType.Docker,
      PlatformType.Kubernetes,
    ],
  };

  return _.compact(
    _.intersection(
      ...connectionTypes.map((p) => connectionTypePlatformType[p])
    ).map((c) => platformDefaultOptions.find((o) => o.value === c))
  );
}
