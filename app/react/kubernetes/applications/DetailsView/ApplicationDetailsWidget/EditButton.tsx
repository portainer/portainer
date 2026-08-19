import { PencilIcon } from 'lucide-react';
import { PropsWithChildren } from 'react';

import { Button } from '@@/buttons';
import { Link } from '@@/Link';

interface Props {
  to: string;
  params?: Record<string, unknown>;

  disabled?: boolean;
}

export function EditButton({
  to = '',
  params,
  children,
  disabled,
}: PropsWithChildren<Props>) {
  return (
    <Button
      type="button"
      color="light"
      size="small"
      data-cy="k8sAppDetail-editAppButton"
      disabled={disabled}
      as={disabled ? 'button' : Link}
      props={disabled ? undefined : { to, params }}
      icon={PencilIcon}
    >
      {children}
    </Button>
  );
}
