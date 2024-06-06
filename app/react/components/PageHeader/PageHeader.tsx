import { useRouter } from '@uirouter/react';
import { PropsWithChildren } from 'react';
import { RefreshCw } from 'lucide-react';

import { dispatchCacheRefreshEvent } from '@/portainer/services/http-request.helper';

import { Button } from '../buttons';

import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';

interface Props {
  id?: string;
  reload?: boolean;
  loading?: boolean;
  onReload?(): Promise<void> | void;
  breadcrumbs?: (Crumb | string)[] | string;
  title: string;
}

export function PageHeader({
  id,
  title,
  breadcrumbs = [],
  reload,
  loading,
  onReload,
  children,
}: PropsWithChildren<Props>) {
  const router = useRouter();

  return (
    <HeaderContainer id={id}>
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <HeaderTitle title={title}>
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
      </HeaderTitle>
    </HeaderContainer>
  );

  function onClickedRefresh() {
    dispatchCacheRefreshEvent();
    return onReload ? onReload() : router.stateService.reload();
  }
}
