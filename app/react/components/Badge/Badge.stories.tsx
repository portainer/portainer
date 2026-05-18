import { Meta, StoryFn } from '@storybook/react-webpack5';

import { Badge, Props } from './Badge';

export default {
  component: Badge,
  title: 'Design System/Badge',
  argTypes: {
    type: {
      control: {
        type: 'select',
        options: [
          'success',
          'danger',
          'warn',
          'info',
          'successSecondary',
          'dangerSecondary',
          'warnSecondary',
          'infoSecondary',
          'muted',
          'accent',
          'custom',
        ],
      },
    },
    shape: {
      control: { type: 'radio', options: ['pill', 'rect'] },
    },
    size: {
      control: { type: 'radio', options: ['sm', 'md'] },
    },
  },
} as Meta<Props>;

export const Default: StoryFn<Props> = () => (
  <div className="flex gap-2">
    <Badge type="success" shape="pill">
      success
    </Badge>
    <Badge type="danger" shape="pill">
      danger
    </Badge>
    <Badge type="info" shape="pill">
      info
    </Badge>
    <Badge type="accent" shape="pill">
      accent
    </Badge>
  </div>
);

export const RectShape: StoryFn<Props> = () => (
  <div className="flex gap-2">
    <Badge type="success" shape="rect">
      success
    </Badge>
    <Badge type="danger" shape="rect">
      danger
    </Badge>
    <Badge type="info" shape="rect">
      info
    </Badge>
    <Badge type="accent" shape="rect">
      accent
    </Badge>
  </div>
);

export const SmallSize: StoryFn<Props> = () => (
  <div className="flex items-center gap-2">
    <Badge type="success" size="sm">
      success
    </Badge>
    <Badge type="danger" size="sm">
      danger
    </Badge>
    <Badge type="info" size="sm">
      info
    </Badge>
    <Badge type="muted" size="sm">
      muted
    </Badge>
  </div>
);

export const CustomClass: StoryFn<Props> = () => (
  <div className="flex gap-2">
    <Badge
      type="custom"
      className="bg-purple-2 text-purple-9 th-dark:bg-purple-10 th-dark:text-purple-3"
    >
      purple
    </Badge>
    <Badge
      type="custom"
      className="bg-yellow-2 text-yellow-9 th-dark:bg-yellow-10 th-dark:text-yellow-3"
    >
      yellow
    </Badge>
  </div>
);
