import { useRouter } from '@uirouter/react';
import { ReactNode } from 'react';

import { Button } from '../Button';

import { Breadcrumbs } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';
import { HeaderTitle } from './HeaderTitle';

interface Props {
  reload?: boolean;
  children?: ReactNode | ReactNode[];
  title: string;
}

export function PageHeader({ title, children, reload }: Props) {
  const router = useRouter();
  return (
    <HeaderContainer>
      <HeaderTitle title={title}>
        {reload && (
          <Button color="link" onClick={() => router.stateService.reload()}>
            <i className="fa fa-sync" aria-hidden="true" />
          </Button>
        )}
      </HeaderTitle>
      <HeaderContent>
        {!!children && <Breadcrumbs>{children}</Breadcrumbs>}
      </HeaderContent>
    </HeaderContainer>
  );
}
