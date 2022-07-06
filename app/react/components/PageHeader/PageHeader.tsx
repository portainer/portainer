import { useRouter } from '@uirouter/react';
import { RefreshCw } from 'react-feather';

import { Button } from '../buttons';

import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';
import { HeaderTitle } from './HeaderTitle';
import styles from './PageHeader.module.css';

interface Props {
  reload?: boolean;
  loading?: boolean;
  onReload?(): Promise<void> | void;
  breadcrumbs?: Crumb[];
  title: string;
}

export function PageHeader({
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
    <HeaderContainer>
      <HeaderContent>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </HeaderContent>
      <HeaderTitle title={title}>
        {reload && (
          <Button
            color="link"
            size="medium"
            onClick={onClickedRefresh}
            className={styles.reloadButton}
            disabled={loading}
          >
            <RefreshCw className="feather icon-sm" />
          </Button>
        )}
      </HeaderTitle>
    </HeaderContainer>
  );
}
