import clsx from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentType, PropsWithChildren, ReactNode } from 'react';

import { Icon } from '@@/Icon';

const cardContainer = cva(
  [
    'overflow-hidden border border-solid border-gray-5',
    'th-highcontrast:border-white',
    'th-dark:border-legacy-grey-3',
  ],
  {
    variants: {
      variant: {
        default: [
          'rounded-xl bg-white',
          'th-highcontrast:bg-black',
          'th-dark:bg-gray-iron-11',
        ],
        filled: [
          'rounded-lg bg-gray-neutral-3',
          'th-highcontrast:bg-gray-warm-10',
          'th-dark:bg-gray-iron-10',
        ],
      },
      shadow: {
        true: 'shadow-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type CardVariant = NonNullable<
  VariantProps<typeof cardContainer>['variant']
>;

/**
 * Low-level card surface. Compose with `Card.Header` for a titled section and `Card.Body` for
 * padded content. Use `variant="filled"` for a gray background.
 * Reach for `Widget` when you need a full dashboard panel with toolbar.
 *
 * @example
 * <Card.Container>
 *   <Card.Header title="Container registries" subtitle="2 connected" />
 *   <Card.Body>Manage pull-through caching and credentials.</Card.Body>
 * </Card.Container>
 */
export const Card = {
  Container: CardContainer,
  Header: CardHeader,
  Body: CardBody,
};

interface CardContainerProps extends VariantProps<typeof cardContainer> {
  className?: string;
  'aria-label'?: string;
}

function CardContainer({
  className,
  children,
  shadow,
  variant,
  'aria-label': ariaLabel,
}: PropsWithChildren<CardContainerProps>) {
  return (
    <section
      aria-label={ariaLabel}
      className={cardContainer({ variant, shadow, className })}
    >
      {children}
    </section>
  );
}

interface CardBodyProps {
  className?: string;
}

function CardBody({ className, children }: PropsWithChildren<CardBodyProps>) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ComponentType<unknown>;
  actions?: ReactNode;
}

function CardHeader({ title, subtitle, icon, actions }: CardHeaderProps) {
  return (
    <div
      className={clsx(
        'min-h-14 flex items-center justify-between gap-4 px-4 py-3.5',
        'border-0 border-b border-solid border-gray-5 bg-gray-iron-2',
        'th-dark:border-legacy-grey-3 th-dark:bg-gray-iron-10',
        'th-highcontrast:border-white th-highcontrast:bg-gray-warm-10'
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="min-h-5 flex items-center gap-2">
          {icon && (
            <Icon
              icon={icon}
              size="md"
              className="shrink-0 opacity-70 th-highcontrast:text-white th-dark:text-gray-3"
            />
          )}
          <span className="text-sm font-extrabold leading-tight tracking-wide text-gray-9 th-highcontrast:text-white th-dark:text-gray-4">
            {title}
          </span>
        </div>
        {subtitle && (
          <span className="text-xs leading-tight text-[var(--text-muted-color)]">
            {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
