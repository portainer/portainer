import { Meta, StoryObj } from '@storybook/react-webpack5';
import { PropsWithChildren } from 'react';
import { Plus, Edit, Download, Settings } from 'lucide-react';

import { MenuButton, MenuButtonLink, MenuButtonProps } from './MenuButton';

const meta: Meta<PropsWithChildren<MenuButtonProps>> = {
  component: MenuButton,
  title: 'Components/Buttons/MenuButton',
  render: (args) => <MenuButton {...args}>{args.children}</MenuButton>,
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'default', 'light'],
    },
    size: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large'],
    },
    dropdownPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
    disabled: {
      control: 'boolean',
    },
    // Hide props that don't make sense to control
    items: { table: { disable: true } },
    menuClassName: { table: { disable: true } },
    className: { table: { disable: true } },
    'data-cy': { table: { disable: true } },
    icon: { table: { disable: true } },
    title: { table: { disable: true } },
  },
};

export default meta;

function basicItems() {
  return [
    <>
      <MenuButtonLink data-cy="test" key="create" to="create">
        <div className="flex items-center gap-2">
          <Plus />
          Create new
        </div>
      </MenuButtonLink>
      <MenuButtonLink data-cy="test" key="edit" to="edit">
        <div className="flex items-center gap-2">
          <Edit />
          Edit existing
        </div>
      </MenuButtonLink>
      <MenuButtonLink data-cy="test" key="download" to="download">
        <div className="flex items-center gap-2">
          <Download />
          Download
        </div>
      </MenuButtonLink>
    </>,
  ];
}

type Story = StoryObj<PropsWithChildren<MenuButtonProps>>;

export const Primary: Story = {
  args: {
    items: basicItems(),
    children: 'Actions',
    color: 'primary',
    size: 'small',
  },
};

export const WithIcon: Story = {
  args: {
    items: basicItems(),
    children: 'Settings',
    color: 'primary',
    icon: Settings,
    'data-cy': 'menu-button-with-icon',
  },
};

export const Large: Story = {
  args: {
    items: basicItems(),
    children: 'Large Menu Button',
    color: 'primary',
    size: 'large',
    icon: Settings,
    'data-cy': 'menu-button-large',
  },
};

export const Small: Story = {
  args: {
    items: basicItems(),
    children: 'Small',
    color: 'primary',
    size: 'small',
    'data-cy': 'menu-button-small',
  },
};

export const XSmall: Story = {
  args: {
    items: basicItems(),
    children: 'XS',
    color: 'primary',
    size: 'xsmall',
    'data-cy': 'menu-button-xsmall',
  },
};

export const DropdownRight: Story = {
  args: {
    items: basicItems(),
    children: 'Right Aligned',
    color: 'primary',
    dropdownPosition: 'right',
    'data-cy': 'menu-button-right',
  },
  decorators: [
    (Story) => (
      <div className="flex justify-end">
        <Story />
      </div>
    ),
  ],
};

export const Disabled: Story = {
  args: {
    items: basicItems(),
    children: 'Disabled Menu',
    color: 'primary',
    disabled: true,
    'data-cy': 'menu-button-disabled',
  },
};

export const WithLinks: Story = {
  args: {
    items: [
      <MenuButtonLink
        key="external"
        to="portainer.home"
        label="External link"
        data-cy="menu-button-link-external"
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-2">
          <Download />
          External link
        </div>
      </MenuButtonLink>,
    ],
    children: 'Mixed Actions',
    color: 'primary',
    'data-cy': 'menu-button-links',
  },
};

export const CustomStyling: Story = {
  args: {
    items: basicItems(),
    children: 'Custom Styled',
    color: 'primary',
    className: 'border-2 border-blue-5',
    menuClassName: 'border-2 border-green-5',
    'data-cy': 'menu-button-custom',
  },
};
