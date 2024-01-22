import { Minus, Plus } from 'lucide-react';
import { PropsWithChildren, ReactNode, useState } from 'react';

import { Icon } from '@@/Icon';
import { Button } from '@@/buttons';

export function AdvancedSettings({
  children,
  label,
}: PropsWithChildren<{
  label: (isOpen: boolean) => ReactNode;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <AdvancedSettingsToggle
        isOpen={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        label={label(isOpen)}
      />

      {isOpen ? children : null}
    </>
  );
}

function AdvancedSettingsToggle({
  label,
  onClick,
  isOpen,
}: {
  isOpen: boolean;
  onClick: () => void;
  label: ReactNode;
}) {
  const icon = isOpen ? Minus : Plus;

  return (
    <div className="form-group">
      <div className="col-sm-12">
        <Button
          color="none"
          onClick={() => onClick()}
          data-cy="advanced-settings-toggle-button"
        >
          <Icon icon={icon} />
          {label}
        </Button>
      </div>
    </div>
  );
}
