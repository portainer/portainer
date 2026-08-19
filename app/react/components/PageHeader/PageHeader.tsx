import { useRouter } from '@uirouter/react';
import { PropsWithChildren } from 'react';
import { RefreshCw } from 'lucide-react';

import { dispatchCacheRefreshEvent } from '@/portainer/services/http-request.helper';

import { VerticalSeparator } from '../VerticalSeparator';
import { Button } from '../buttons';

import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';
import { PageTitle } from './PageTitle';
import { SidebarToggleButton } from './SidebarToggleButton';

interface Props {
  id?: string;
  reload?: boolean;
  loading?: boolean;
  onReload?(): Promise<void> | void;
  breadcrumbs?: (Crumb | string)[] | string;
  title?: string;
  /** Render the visible page title row. Defaults to true when title is provided.
   * Set to false on screens that display the title via another component (e.g.
   * `ResourceDetailHeader`) to avoid showing it twice. */
  showTitle?: boolean;
}

export function PageHeader({
  id,
  title,
  breadcrumbs = [],
  reload,
  loading,
  onReload,
  showTitle = !!title,
  children,
}: PropsWithChildren<Props>) {
  const router = useRouter();

  return (
    <>
      <HeaderContainer id={id}>
        <div className="flex min-w-0 items-center">
          <SidebarToggleButton />
          <VerticalSeparator />
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        </div>
        <HeaderTitle />
      </HeaderContainer>

      {showTitle && title && (
        <PageTitle title={title}>
          {(reload || children) && (
            <div className="ml-auto flex items-center gap-2">
              {reload && (
                <Button
                  color="none"
                  size="large"
                  onClick={onClickedRefresh}
                  className="m-0 p-0 focus:text-inherit"
                  disabled={loading}
                  title="Refresh page"
                  data-cy="refresh-page-button"
                >
                  <RefreshCw className="icon" />
                </Button>
              )}
              {children}
            </div>
          )}
        </PageTitle>
      )}
    </>
  );

  function onClickedRefresh() {
    dispatchCacheRefreshEvent();
    return onReload ? onReload() : router.stateService.reload();
  }
}
