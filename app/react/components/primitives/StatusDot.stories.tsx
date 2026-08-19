import { Meta, StoryFn } from '@storybook/react-webpack5';

import { StatusDot } from './StatusDot';
import type { StatusDotColor, StatusDotSize } from './StatusDot';

export default {
  component: StatusDot,
  title: 'Design System/Primitives/StatusDot',
} as Meta;

const colors: StatusDotColor[] = ['success', 'warn', 'danger', 'muted', 'info'];
const sizes: StatusDotSize[] = ['xs', 'sm', 'md'];

export const AllColors: StoryFn = () => (
  <div className="flex items-center gap-3">
    {colors.map((color) => (
      <div key={color} className="flex flex-col items-center gap-1">
        <StatusDot color={color} />
        <span className="text-xs">{color}</span>
      </div>
    ))}
  </div>
);

export const AllSizes: StoryFn = () => (
  <div className="flex items-center gap-3">
    {sizes.map((size) => (
      <div key={size} className="flex flex-col items-center gap-1">
        <StatusDot color="success" size={size} />
        <span className="text-xs">{size}</span>
      </div>
    ))}
  </div>
);

export const Pulse: StoryFn = () => (
  <div className="flex items-center gap-3">
    {colors.map((color) => (
      <StatusDot key={color} color={color} pulse />
    ))}
  </div>
);
