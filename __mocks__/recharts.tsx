import { cloneElement, ReactElement } from 'react';

export * from 'recharts';

// jsdom reports zero layout dimensions, so recharts renders nothing without
// an explicit size. Pass one through instead of measuring the container.
export function ResponsiveContainer({ children }: { children: ReactElement }) {
  return cloneElement(children, { width: 800, height: 300 });
}
