import { Plus, ChevronDown } from 'lucide-react';
import { ComponentProps, PropsWithChildren } from 'react';
import { Menu, MenuButton, MenuItem, MenuPopover } from '@reach/menu-button';
import { positionRight } from '@reach/popover';

import { Authorized } from '@/react/hooks/useUser';

import { Widget } from '@@/Widget';
import { Button, ButtonGroup } from '@@/buttons';
import { ButtonWithRef } from '@@/buttons/Button';

export function ServiceWidget({
  titleIcon,
  title,
  children,
  onAdd,
  hasChanges,
  onReset,
  onSubmit,
  labelForAddButton,
}: PropsWithChildren<{
  titleIcon: ComponentProps<typeof Widget.Title>['icon'];
  title: string;
  onAdd(): void;
  hasChanges: boolean;
  onReset(all?: boolean): void;
  onSubmit(): void;
  labelForAddButton: string;
}>) {
  return (
    <Widget>
      <Widget.Title icon={titleIcon} title={title}>
        <Authorized authorizations="DockerServiceUpdate">
          <Button color="secondary" size="small" onClick={onAdd} icon={Plus}>
            {labelForAddButton}
          </Button>
        </Authorized>
      </Widget.Title>

      <Widget.Body className="!p-0">{children}</Widget.Body>

      <Authorized authorizations="DockerServiceUpdate">
        <Widget.Footer>
          <ButtonGroup>
            <Button type="button" onClick={onSubmit} disabled={!hasChanges}>
              Apply changes
            </Button>

            <Menu>
              <MenuButton
                as={ButtonWithRef}
                size="small"
                color="default"
                icon={ChevronDown}
              >
                <span className="sr-only">Toggle Dropdown</span>
              </MenuButton>
              <MenuPopover position={positionRight}>
                <div className="mt-3 bg-white th-highcontrast:bg-black th-dark:bg-black">
                  <MenuItem onSelect={() => onReset()}>Reset changes</MenuItem>
                  <MenuItem onSelect={() => onReset(true)}>
                    Reset all changes
                  </MenuItem>
                </div>
              </MenuPopover>
            </Menu>
          </ButtonGroup>
        </Widget.Footer>
      </Authorized>
    </Widget>
  );
}
