import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/portainer/hooks/usePaginationLimitState';
import { Environment } from '@/portainer/environments/types';
import { Button } from '@/portainer/components/Button';
import { useIsAdmin } from '@/portainer/hooks/useUser';
import {
  SearchBar,
  useSearchBarState,
} from '@/portainer/components/datatables/components/SearchBar';
import {
  TableActions,
  TableContainer,
  TableTitle,
} from '@/portainer/components/datatables/components';
import { TableFooter } from '@/portainer/components/datatables/components/TableFooter';
import { useDebounce } from '@/portainer/hooks/useDebounce';
import { useEnvironmentList } from '@/portainer/environments/queries';
import { useGroups } from '@/portainer/environment-groups/queries';

import { EnvironmentItem } from './EnvironmentItem';
import { KubeconfigButton } from './KubeconfigButton';
import styles from './EnvironmentList.module.css';
import { NoEnvironmentsInfoPanel } from './NoEnvironmentsInfoPanel';

interface Props {
  onClickItem(environment: Environment): void;
  onRefresh(): void;
}

export function EnvironmentList({ onClickItem, onRefresh }: Props) {
  const isAdmin = useIsAdmin();
  const storageKey = 'home_endpoints';

  const [searchBarValue, setSearchBarValue] = useSearchBarState(storageKey);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [page, setPage] = useState(1);

  const debouncedTextFilter = useDebounce(searchBarValue);

  useEffect(() => {
    setPage(1);
  }, [searchBarValue]);

  const groupsQuery = useGroups();

  const { isLoading, environments, totalCount, totalAvailable } =
    useEnvironmentList({ page, pageLimit, search: debouncedTextFilter }, true);

  return (
    <>
      {totalAvailable === 0 && <NoEnvironmentsInfoPanel isAdmin={isAdmin} />}
      <div className="row">
        <div className="col-sm-12">
          <TableContainer>
            <TableTitle icon="fa-plug" label="Environments" />

            <TableActions className={styles.actionBar}>
              <div className={styles.description}>
                <i className="fa fa-exclamation-circle blue-icon space-right" />
                Click on an environment to manage
              </div>

              {isAdmin && (
                <Button
                  onClick={onRefresh}
                  data-cy="home-refreshEndpointsButton"
                  className={clsx(styles.refreshEnvironmentsButton)}
                >
                  <i className="fa fa-sync space-right" aria-hidden="true" />
                  Refresh
                </Button>
              )}

              <KubeconfigButton environments={environments} />
            </TableActions>

            <SearchBar
              value={searchBarValue}
              onChange={setSearchBarValue}
              placeholder="Search by name, group, tag, status, URL..."
              data-cy="home-endpointsSearchInput"
            />

            <div className="blocklist" data-cy="home-endpointList">
              {renderItems(
                isLoading,
                totalCount,
                environments.map((env) => (
                  <EnvironmentItem
                    key={env.Id}
                    environment={env}
                    groupName={
                      groupsQuery.data?.find((g) => g.Id === env.GroupId)?.Name
                    }
                    onClick={onClickItem}
                  />
                ))
              )}
            </div>

            <TableFooter>
              <PaginationControls
                showAll={totalCount <= 100}
                pageLimit={pageLimit}
                page={page}
                onPageChange={setPage}
                totalCount={totalCount}
                onPageLimitChange={setPageLimit}
              />
            </TableFooter>
          </TableContainer>
        </div>
      </div>
    </>
  );
}

function renderItems(
  isLoading: boolean,
  totalCount: number,

  items: ReactNode
) {
  if (isLoading) {
    return (
      <div className="text-center text-muted" data-cy="home-loadingEndpoints">
        Loading...
      </div>
    );
  }

  if (!totalCount) {
    return (
      <div className="text-center text-muted" data-cy="home-noEndpoints">
        No environments available.
      </div>
    );
  }

  return items;
}
