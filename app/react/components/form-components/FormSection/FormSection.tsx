import { PropsWithChildren, ReactNode, useState } from 'react';
import { ChevronUp, ChevronRight } from 'lucide-react';

import { Icon } from '@@/Icon';

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

  return (
    <div className={className}>
      <FormSectionTitle
        htmlFor={isFoldable ? `foldingButton${title}` : htmlFor}
        titleSize={titleSize}
        className={titleClassName}
      >
        {isFoldable && (
          <button
            id={`foldingButton${title}`}
            type="button"
            onClick={(e) => {
              setIsExpanded(!isExpanded);
              e.stopPropagation();
              e.preventDefault();
            }}
            className="mx-2 !ml-0 inline-flex w-2 items-center justify-center border-0 bg-transparent"
          >
            <Icon
              icon={isExpanded ? ChevronUp : ChevronRight}
              className="shrink-0"
            />
          </button>
        )}

        {title}
      </FormSectionTitle>

      {isExpanded && children}
    </div>
  );
}
