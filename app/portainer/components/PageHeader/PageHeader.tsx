import { useRouter } from '@uirouter/react';

import { Button } from '../Button';

import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';
import { HeaderTitle } from './HeaderTitle';
import styles from './PageHeader.module.css';

interface Props {
  reload?: boolean;
  breadcrumbs?: Crumb[];
  title: string;
}

export function PageHeader({ title, breadcrumbs = [], reload }: Props) {
  const router = useRouter();
  return (
    <HeaderContainer>
      <HeaderTitle title={title}>
        {reload && (
          <Button
            color="link"
            size="medium"
            onClick={() => router.stateService.reload()}
            className={styles.reloadButton}
          >
            <i className="fa fa-sync" aria-hidden="true" />
          </Button>
        )}
      </HeaderTitle>
      <HeaderContent>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </HeaderContent>
    </HeaderContainer>
  );
}
