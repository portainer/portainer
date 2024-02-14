import { useCurrentUser } from '@/react/hooks/useUser';

import { InsightsBox } from '@@/InsightsBox';
import { Link } from '@@/Link';

export function StackNameLabelInsight() {
  const { isAdmin } = useCurrentUser();
  const insightsBoxContent = (
    <>
      The stack field below was previously labelled &apos;Name&apos; but, in
      fact, it&apos;s always been the stack name (hence the relabelling).
      {isAdmin && (
        <>
          <br />
          Kubernetes Stacks functionality can be turned off entirely via{' '}
          <Link to="portainer.settings" target="_blank">
            Kubernetes Settings
          </Link>
          .
        </>
      )}
    </>
  );

  return (
    <InsightsBox
      type="slim"
      header="Stack"
      content={insightsBoxContent}
      insightCloseId="k8s-stacks-name"
    />
  );
}
