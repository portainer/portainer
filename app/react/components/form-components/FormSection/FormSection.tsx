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
}

export function FormSection({
  title,
  titleSize = 'md',
  children,
  isFoldable = false,
  defaultFolded = isFoldable,
  titleClassName,
}: PropsWithChildren<Props>) {
  const [isExpanded, setIsExpanded] = useState(!defaultFolded);

  return (
    <>
      <FormSectionTitle
        htmlFor={isFoldable ? `foldingButton${title}` : ''}
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
    </>
  );
}
