import { useRouter } from '@uirouter/react';

import { Button } from '../Button';

import { Breadcrumbs } from './Breadcrumbs';
import { Crumb } from './Breadcrumbs/Breadcrumbs';
import { HeaderContainer } from './HeaderContainer';
import { HeaderContent } from './HeaderContent';
import { HeaderTitle } from './HeaderTitle';

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
          <Button color="link" onClick={() => router.stateService.reload()}>
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
