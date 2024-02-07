import { InsightsBox } from '@@/InsightsBox';

export function HelmInsightsBox() {
  return (
    <InsightsBox
      header="Helm option"
      content={
        <span>
          From 2.20 and on, the Helm menu sidebar option has moved to the{' '}
          <strong>Create from manifest screen</strong> - accessed via the button
          above.
        </span>
      }
      insightCloseId="k8s-helm"
    />
  );
}
