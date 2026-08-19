import clsx from 'clsx';

import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { BEFeatureIndicator } from './BEFeatureIndicator';

type Variants = 'form-section' | 'widget' | 'multi-widget';

type OverlayClasses = {
  beLinkContainerClassName: string;
  contentClassName: string;
};

const variantClassNames: Record<Variants, OverlayClasses> = {
  'form-section': {
    beLinkContainerClassName: '',
    contentClassName: '',
  },
  widget: {
    beLinkContainerClassName: '',
    // no padding so that the border overlaps the widget border
    contentClassName: '!p-0',
  },
  'multi-widget': {
    beLinkContainerClassName: 'm-4',
    // widgets have a mx of 15px and mb of 15px - match this at the top with padding
    contentClassName: '!p-0 !pt-[15px]',
  },
};

export function BEOverlay({
  featureId,
  children,
  variant = 'form-section',
}: {
  featureId: FeatureId;
  children: React.ReactNode;
  variant?: 'form-section' | 'widget' | 'multi-widget';
}) {
  const isLimited = isLimitedToBE(featureId);
  if (!isLimited) {
    return <>{children}</>;
  }

  return (
    <div className="be-indicator-container limited-be">
      <div
        className={clsx(
          'limited-be-link vertical-center',
          variantClassNames[variant].beLinkContainerClassName
        )}
      >
        <BEFeatureIndicator featureId={featureId} />
      </div>
      <div
        className={clsx(
          'limited-be-content',
          variantClassNames[variant].contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
