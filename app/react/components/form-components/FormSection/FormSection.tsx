import { PropsWithChildren, ReactNode, useState } from 'react';

import { CollapseExpandButton } from '@@/CollapseExpandButton';

import { FormSectionTitle } from '../FormSectionTitle';

interface Props {
  title: ReactNode;
  titleSize?: 'sm' | 'md' | 'lg';
  isFoldable?: boolean;
  defaultFolded?: boolean;
  titleClassName?: string;
  className?: string;
  htmlFor?: string;
}

export function FormSection({
  title,
  titleSize = 'md',
  children,
  isFoldable = false,
  defaultFolded = isFoldable,
  titleClassName,
  className,
  htmlFor = '',
}: PropsWithChildren<Props>) {
  const [isExpanded, setIsExpanded] = useState(!defaultFolded);
  const id = `foldingButton${title}`;

  return (
    <div className={className}>
      <FormSectionTitle
        htmlFor={isFoldable ? id : htmlFor}
        titleSize={titleSize}
        className={titleClassName}
      >
        {isFoldable && (
          <CollapseExpandButton
            isExpanded={isExpanded}
            data-cy={id}
            id={id}
            onClick={() => setIsExpanded((isExpanded) => !isExpanded)}
          />
        )}

        {title}
      </FormSectionTitle>

      {isExpanded && children}
    </div>
  );
}
