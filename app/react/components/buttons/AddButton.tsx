import { Plus } from 'lucide-react';
import { ComponentProps, PropsWithChildren } from 'react';

import { AutomationTestingProps } from '@/types';

import { Link } from '@@/Link';

import { Button } from './Button';

export function AddButton({
  to = '.new',
  params,
  children,
  color = 'primary',
  disabled,
  'data-cy': dataCy,
}: PropsWithChildren<
  {
    to?: string;
    params?: object;
    color?: ComponentProps<typeof Button>['color'];
    disabled?: boolean;
  } & AutomationTestingProps
>) {
  return (
    <Button
      as={Link}
      props={{ to, params }}
      icon={Plus}
      className="!m-0"
      data-cy={dataCy}
      color={color}
      disabled={disabled}
    >
      {children || 'Add'}
    </Button>
  );
}
