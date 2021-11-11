import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

import { Widget, WidgetBody } from '@/portainer/components/widget';
import { PaginationControls } from '@/portainer/components/pagination-controls';
import { usePaginationLimitState } from '@/common/hooks/usePaginationLimitState';
import { useTextFilterState } from '@/common/hooks/useTextFilterState';
import { Environment } from '@/portainer/environments/types';
import { useDebounce } from '@/common/hooks/useDebounce';
import { Button } from '@/portainer/components/Button';
import { type EnvironmentGroup } from '@/portainer/environment-groups/types';
import { type Tag } from '@/portainer/tags/types';
import EndpointHelper from '@/portainer/helpers/endpointHelper';
import { useIsAdmin } from '@/portainer/hooks/useUser';

import { EnvironmentItem } from './EnvironmentItem';
import { KubeconfigButton } from './KubeconfigButton';
import { useEnvironmentsList } from './useEnvironmentsList';
import styles from './EnvironmentList.module.css';

interface Props {
  homepageLoadTime: number;
  tags?: Tag[];
  groups: EnvironmentGroup[];
  onClickItem(environment: Environment): void;
  onRefresh(): void;
}

export function EnvironmentList({
  tags,
  onClickItem,
  onRefresh,
  homepageLoadTime,
  groups,
}: Props) {
  const storageKey = 'home_endpoints';

  const [textFilter, setTextFilter] = useTextFilterState(storageKey);
  const [pageLimit, setPageLimit] = usePaginationLimitState(storageKey);
  const [page, setPage] = useState(1);

  const debouncedTextFilter = useDebounce(textFilter);

  const isAdmin = useIsAdmin();
  const isRefreshVisible = isAdmin;

  useEffect(() => {
    setPage(1);
  }, [textFilter]);

  const { isLoading, environments, totalCount } = useEnvironmentsList(
    page,
    pageLimit,
    debouncedTextFilter
  );

  EndpointHelper.mapGroupNameToEndpoint(environments, groups);

  return (
    <div className="datatable">
      <Widget>
        <WidgetBody className="no-padding">
          <div className="toolBar">
            <div className="toolBarTitle">
              <i className="fa fa-plug space-right" aria-hidden="true" />
              Environments
            </div>
          </div>

          <div className={clsx(styles.actionBar, 'actionBar')}>
            <div className={styles.description}>
              <i className="fa fa-exclamation-circle blue-icon space-right" />
              Click on an environment to manage
            </div>

            {isRefreshVisible && (
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
          </div>

          <div className="searchBar">
            <i className="fa fa-search searchIcon" aria-hidden="true" />

            <input
              type="text"
              className="searchInput"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="Search by name, group, tag, status, URL..."
              data-cy="home-endpointsSearchInput"
            />
          </div>

          <div className="blocklist">
            {renderItems(
              isLoading,
              totalCount,
              environments.map((env) => (
                <EnvironmentItem
                  key={env.Id}
                  environment={env}
                  onClick={onClickItem}
                  isAdmin={isAdmin}
                  tags={tags}
                  homepageLoadTime={homepageLoadTime}
                />
              ))
            )}
          </div>

          <div className="footer">
            <PaginationControls
              showAll={totalCount <= 100}
              pageLimit={pageLimit}
              page={page}
              onPageChange={setPage}
              totalCount={totalCount}
              onPageLimitChange={setPageLimit}
            />
          </div>
        </WidgetBody>
      </Widget>
    </div>
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
