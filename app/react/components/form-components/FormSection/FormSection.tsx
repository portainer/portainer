import { PropsWithChildren, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Icon } from '@@/Icon';

import { FormSectionTitle } from '../FormSectionTitle';

interface Props {
  title: string;
  isFoldable?: boolean;
}

export function FormSection({
  title,
  children,
  isFoldable = false,
}: PropsWithChildren<Props>) {
  const [isExpanded, setIsExpanded] = useState(!isFoldable);

  return (
    <>
      <FormSectionTitle htmlFor={isFoldable ? `foldingButton${title}` : ''}>
        {isFoldable && (
          <button
            id={`foldingButton${title}`}
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-0 mx-2 !ml-0 bg-transparent inline-flex justify-center items-center w-2"
          >
            <Icon
              icon={isExpanded ? ChevronDown : ChevronRight}
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
