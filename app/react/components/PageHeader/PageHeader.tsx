import { useRouter } from '@uirouter/react';
import { RefreshCw } from 'react-feather';

import { Button } from '../buttons';

import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderTitle } from './HeaderTitle';
import styles from './PageHeader.module.css';

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
}: Props) {
  const router = useRouter();

  function onClickedRefresh() {
    return onReload ? onReload() : router.stateService.reload();
  }

  return (
    <HeaderContainer id={id}>
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <HeaderTitle title={title}>
        {reload && (
          <Button
            color="none"
            size="large"
            onClick={onClickedRefresh}
            className={styles.reloadButton}
            disabled={loading}
          >
            <RefreshCw className="icon" />
          </Button>
        )}
      </HeaderTitle>
    </HeaderContainer>
  );
}
