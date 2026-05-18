import { cva, type VariantProps } from 'class-variance-authority';
import { ElementType, ReactNode } from 'react';

import { TabContext, TabVariant, TabSize } from './TabsItem';

const tabsContainerOuter = cva('', {
  variants: {
    variant: {
      pill: 'flex flex-wrap gap-2.5',
      contained: [
        'inline-flex overflow-hidden',
        'border border-solid border-[var(--border-widget)] bg-[var(--bg-widget-color)]',
      ],
    },
    size: {
      md: '',
      sm: '',
    },
  },
  compoundVariants: [
    { variant: 'contained', size: 'md', className: 'rounded-xl' },
    { variant: 'contained', size: 'sm', className: 'rounded-md' },
  ],
  defaultVariants: {
    variant: 'contained',
    size: 'md',
  },
});

const tabsContainerInner = cva('flex items-center overflow-x-auto', {
  variants: {
    size: {
      md: 'gap-1 p-1',
      sm: 'gap-0.5 p-0.5',
    },
  },
  defaultVariants: { size: 'md' },
});

interface Props extends VariantProps<typeof tabsContainerOuter> {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function TabsContainer({
  as: Component = 'div',
  className,
  children,
  variant = 'contained',
  size = 'md',
  'aria-label': ariaLabel,
}: Props) {
  const ctx: { variant: TabVariant; size: TabSize } = {
    variant: variant ?? 'contained',
    size: size ?? 'md',
  };

  if (variant === 'pill') {
    return (
      <TabContext.Provider value={ctx}>
        <Component
          className={tabsContainerOuter({ variant, size, className })}
          aria-label={ariaLabel}
        >
          {children}
        </Component>
      </TabContext.Provider>
    );
  }

  return (
    <TabContext.Provider value={ctx}>
      <Component
        className={tabsContainerOuter({ variant, size, className })}
        aria-label={ariaLabel}
      >
        {/* inner div so the overflow-x-auto scrollbar doesn't overlap the rounded corners */}
        <div className={tabsContainerInner({ size })}>{children}</div>
      </Component>
    </TabContext.Provider>
  );
}
