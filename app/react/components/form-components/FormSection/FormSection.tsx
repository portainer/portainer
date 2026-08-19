import { PropsWithChildren, ReactNode, useState } from 'react';

import { CollapseExpandButton } from '@@/CollapseExpandButton';

import { FormSectionTitle } from '../FormSectionTitle';

interface Props {
  id?: string;
  title: ReactNode;
  titleSize?: 'sm' | 'md' | 'lg';
  isFoldable?: boolean;
  defaultFolded?: boolean;
  titleClassName?: string;
  className?: string;
  htmlFor?: string;
  setIsDefaultFolded?: (isDefaultFolded: boolean) => void;
}

let componentIndex = 0;

export function FormSection({
  id,
  title,
  titleSize = 'md',
  children,
  isFoldable = false,
  defaultFolded = isFoldable,
  titleClassName,
  className,
  htmlFor = '',
  setIsDefaultFolded,
}: PropsWithChildren<Props>) {
  const [labelId] = useState(
    () => `form-section-label-${componentIndex++}` as const
  );
  const [isExpanded, setIsExpanded] = useState(!defaultFolded);

  const collapsibleIdSuffix = typeof title === 'string' ? title : id || labelId;
  const collapsibleId = `foldingButton${collapsibleIdSuffix}`;

  return (
    <section className={className} id={id} aria-labelledby={labelId}>
      <FormSectionTitle
        htmlFor={isFoldable ? collapsibleId : htmlFor}
        titleSize={titleSize}
        className={titleClassName}
        id={labelId}
      >
        {isFoldable && (
          <CollapseExpandButton
            isExpanded={isExpanded}
            data-cy={collapsibleId}
            id={collapsibleId}
            onClick={() => {
              setIsExpanded((isExpanded) => !isExpanded);
              setIsDefaultFolded?.(isExpanded);
            }}
          />
        )}

        {title}
      </FormSectionTitle>
      {/* col-sm-12 in the title has a 'float: left' style - 'clear-both' makes sure it doesn't get in the way of the next div */}
      {/* https://stackoverflow.com/questions/7759837/put-divs-below-floatleft-divs */}
      <div className="clear-both">{isExpanded && children}</div>
    </section>
  );
}
