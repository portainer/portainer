import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BETeaserButton } from '@@/BETeaserButton';
import { Tooltip } from '@@/Tip/Tooltip';

export function AnnotationsBeTeaser() {
  return (
    <div className="col-sm-12 text-muted mb-2 block px-0">
      <div className="control-label !mb-2 text-left font-medium">
        Annotations
        <Tooltip
          message={
            <div className="vertical-center">
              <span>
                Allows specifying of{' '}
                <a
                  href="https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/"
                  target="_black"
                >
                  annotations
                </a>{' '}
                for the object. See further Kubernetes documentation on{' '}
                <a
                  href="https://kubernetes.io/docs/reference/labels-annotations-taints/"
                  target="_black"
                >
                  well-known annotations
                </a>
                .
              </span>
            </div>
          }
        />
      </div>
      <div className="block">
        <BETeaserButton
          className="!p-0"
          heading="Add annotation"
          buttonText="Add annotation"
          message="Allows specifying of annotations on this resource."
          featureId={FeatureId.K8S_ANNOTATIONS}
          buttonClassName="!ml-0"
          data-cy="annotations-be-teaser"
        />
      </div>
    </div>
  );
}
