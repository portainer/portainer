import { useState } from 'react';
import { compact } from 'lodash';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { AlertTriangle } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEvents } from '@/react/kubernetes/queries/useEvents';

import { NavTabs, Option } from '@@/NavTabs';
import { Badge } from '@@/Badge';
import { Icon } from '@@/Icon';

import { HelmRelease } from '../../types';
import { useHelmHistory } from '../../helmReleaseQueries/useHelmHistory';

import { ManifestDetails } from './ManifestDetails';
import { NotesDetails } from './NotesDetails';
import { ValuesDetails } from './ValuesDetails';
import { ResourcesTable } from './ResourcesTable/ResourcesTable';
import { DiffControl, DiffViewMode } from './DiffControl';
import { useHelmReleaseToCompare } from './useHelmReleaseToCompare';
import {
  filterRelatedEvents,
  HelmEventsDatatable,
  useHelmEventsTableState,
} from './HelmEventsDatatable';

type Props = {
  release: HelmRelease;
  selectedRevision: number;
};

type Tab = 'values' | 'notes' | 'manifest' | 'resources' | 'events';

export function ReleaseTabs({ release, selectedRevision }: Props) {
  const {
    params: { tab },
  } = useCurrentStateAndParams();
  const router = useRouter();
  const environmentId = useEnvironmentId();
  // state is here so that the state isn't lost when the tab changes
  const [isUserSupplied, setIsUserSupplied] = useState(true);
  // start with NaN so that the input is empty (see <Input /> for more details)
  const [selectedCompareRevisionNumber, setSelectedCompareRevisionNumber] =
    useState(NaN);
  const [diffViewMode, setDiffViewMode] = useState<DiffViewMode>('view');

  const historyQuery = useHelmHistory(
    environmentId,
    release.name,
    release.namespace ?? ''
  );
  const earliestRevisionNumber =
    historyQuery.data?.[historyQuery.data.length - 1]?.version ??
    release.version ??
    1;
  const latestRevisionNumber =
    historyQuery.data?.[0]?.version ?? release.version ?? 1;
  const { compareRelease, isCompareReleaseLoading, isCompareReleaseError } =
    useHelmReleaseToCompare(
      release,
      earliestRevisionNumber,
      latestRevisionNumber,
      diffViewMode,
      selectedRevision,
      selectedCompareRevisionNumber
    );

  const { autoRefreshRate } = useHelmEventsTableState();
  const { data: eventWarningCount } = useEvents(environmentId, {
    namespace: release.namespace ?? '',
    queryOptions: {
      autoRefreshRate: autoRefreshRate * 1000,
      select: (data) => {
        const relatedEvents = filterRelatedEvents(
          data,
          release.info?.resources ?? []
        );
        return relatedEvents.filter((e) => e.type === 'Warning').length;
      },
    },
  });

  return (
    <NavTabs<Tab>
      onSelect={setTab}
      selectedId={parseValidTab(tab, !!release.info?.notes)}
      type="pills"
      justified
      options={helmTabs(
        release,
        isUserSupplied,
        setIsUserSupplied,
        earliestRevisionNumber,
        latestRevisionNumber,
        selectedRevision,
        selectedCompareRevisionNumber,
        setSelectedCompareRevisionNumber,
        diffViewMode,
        handleDiffViewChange,
        isCompareReleaseLoading,
        isCompareReleaseError,
        eventWarningCount ?? 0,
        compareRelease
      )}
    />
  );

  function handleDiffViewChange(diffViewMode: DiffViewMode) {
    setDiffViewMode(diffViewMode);

    if (latestRevisionNumber === earliestRevisionNumber) {
      return;
    }

    // if the input for compare revision number is NaN, set it to the previous revision number
    if (
      Number.isNaN(selectedCompareRevisionNumber) &&
      diffViewMode === 'specific'
    ) {
      if (selectedRevision > earliestRevisionNumber) {
        setSelectedCompareRevisionNumber(selectedRevision - 1);
        return;
      }
      // it could be useful to compare to the latest revision number if the selected revision number is the earliest revision number
      setSelectedCompareRevisionNumber(latestRevisionNumber);
    }
  }

  function setTab(tab: Tab) {
    router.stateService.go('kubernetes.helm', {
      tab,
    });
  }
}

function helmTabs(
  release: HelmRelease,
  isUserSupplied: boolean,
  setIsUserSupplied: (isUserSupplied: boolean) => void,
  earliestRevisionNumber: number,
  latestRevisionNumber: number,
  selectedRevisionNumber: number,
  compareRevisionNumber: number,
  setCompareRevisionNumber: (compareRevisionNumber: number) => void,
  diffViewMode: DiffViewMode,
  setDiffViewMode: (diffViewMode: DiffViewMode) => void,
  isCompareReleaseLoading: boolean,
  isCompareReleaseError: boolean,
  eventWarningCount: number,
  compareRelease?: HelmRelease
): Option<Tab>[] {
  // as long as the latest revision number is greater than the earliest revision number, there are changes to compare
  const showDiffControl = latestRevisionNumber > earliestRevisionNumber;

  return compact([
    {
      label: 'Resources',
      id: 'resources',
      children: <ResourcesTable />,
    },
    {
      label: (
        <>
          Events
          {eventWarningCount >= 1 && (
            <Badge type="warnSecondary">
              <Icon icon={AlertTriangle} className="!mr-1" />
              {eventWarningCount}
            </Badge>
          )}
        </>
      ),
      id: 'events',
      children: (
        <HelmEventsDatatable
          namespace={release.namespace ?? ''}
          releaseResources={release.info?.resources ?? []}
        />
      ),
    },
    {
      label: 'Values',
      id: 'values',
      children: (
        <ValuesDetails
          values={release.values}
          isUserSupplied={isUserSupplied}
          selectedRevisionNumber={selectedRevisionNumber}
          diffViewMode={diffViewMode}
          compareValues={compareRelease?.values}
          compareRevisionNumberFetched={compareRelease?.version}
          isCompareReleaseLoading={isCompareReleaseLoading}
          isCompareReleaseError={isCompareReleaseError}
          diffControl={
            <DiffControl
              selectedRevisionNumber={selectedRevisionNumber}
              latestRevisionNumber={latestRevisionNumber}
              earliestRevisionNumber={earliestRevisionNumber}
              compareRevisionNumber={compareRevisionNumber}
              setCompareRevisionNumber={setCompareRevisionNumber}
              diffViewMode={diffViewMode}
              setDiffViewMode={setDiffViewMode}
              isUserSupplied={isUserSupplied}
              setIsUserSupplied={setIsUserSupplied}
              showUserSuppliedCheckbox
            />
          }
        />
      ),
    },
    {
      label: 'Manifest',
      id: 'manifest',
      children: (
        <ManifestDetails
          manifest={release.manifest}
          selectedRevisionNumber={selectedRevisionNumber}
          diffViewMode={diffViewMode}
          compareManifest={compareRelease?.manifest}
          compareRevisionNumberFetched={compareRelease?.version}
          isCompareReleaseLoading={isCompareReleaseLoading}
          isCompareReleaseError={isCompareReleaseError}
          diffControl={
            showDiffControl && (
              <DiffControl
                selectedRevisionNumber={selectedRevisionNumber}
                latestRevisionNumber={latestRevisionNumber}
                earliestRevisionNumber={earliestRevisionNumber}
                compareRevisionNumber={compareRevisionNumber}
                setCompareRevisionNumber={setCompareRevisionNumber}
                diffViewMode={diffViewMode}
                setDiffViewMode={setDiffViewMode}
              />
            )
          }
        />
      ),
    },
    !!release.info?.notes && {
      label: 'Notes',
      id: 'notes',
      children: (
        <NotesDetails
          notes={release.info.notes}
          selectedRevisionNumber={selectedRevisionNumber}
          diffViewMode={diffViewMode}
          compareNotes={compareRelease?.info?.notes}
          compareRevisionNumberFetched={compareRelease?.version}
          isCompareReleaseLoading={isCompareReleaseLoading}
          isCompareReleaseError={isCompareReleaseError}
          diffControl={
            showDiffControl && (
              <DiffControl
                selectedRevisionNumber={selectedRevisionNumber}
                latestRevisionNumber={latestRevisionNumber}
                earliestRevisionNumber={earliestRevisionNumber}
                compareRevisionNumber={compareRevisionNumber}
                setCompareRevisionNumber={setCompareRevisionNumber}
                diffViewMode={diffViewMode}
                setDiffViewMode={setDiffViewMode}
              />
            )
          }
        />
      ),
    },
  ]);
}

function parseValidTab(tab: string, hasNotes: boolean): Tab {
  if (
    tab === 'values' ||
    (tab === 'notes' && hasNotes) ||
    tab === 'manifest' ||
    tab === 'resources' ||
    tab === 'events'
  ) {
    return tab;
  }
  return 'resources';
}
