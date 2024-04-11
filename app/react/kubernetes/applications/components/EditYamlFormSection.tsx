import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironmentDeploymentOptions } from '@/react/portainer/environments/queries/useEnvironment';
import { useAuthorizations } from '@/react/hooks/useUser';

import { WebEditorForm } from '@@/WebEditorForm';
import { TextTip } from '@@/Tip/TextTip';

type StackFileContent = string;

type Props = {
  values: StackFileContent;
  onChange: (values: StackFileContent) => void;
  isComposeFormat?: boolean;
};

export function EditYamlFormSection({
  values,
  onChange,
  isComposeFormat,
}: Props) {
  // check if the user is allowed to edit the yaml
  const environmentId = useEnvironmentId();
  const { data: deploymentOptions } =
    useEnvironmentDeploymentOptions(environmentId);
  const { authorized: roleHasAuth } = useAuthorizations('K8sYAMLW');
  const isAllowedToEdit = roleHasAuth && !deploymentOptions?.hideWebEditor;
  const formId = 'kubernetes-deploy-editor';

  return (
    <div>
      <WebEditorForm
        data-cy="k8s-yaml-editor"
        value={values}
        readonly={!isAllowedToEdit}
        titleContent={<TitleContent isComposeFormat={isComposeFormat} />}
        onChange={(values) => onChange(values)}
        id={formId}
        placeholder="Define or paste the content of your manifest file here"
        yaml
      />
    </div>
  );
}

function TitleContent({ isComposeFormat }: { isComposeFormat?: boolean }) {
  return (
    <>
      {isComposeFormat && (
        <TextTip color="orange">
          <p>
            Portainer no longer supports{' '}
            <a
              href="https://docs.docker.com/compose/compose-file/"
              target="_blank"
              rel="noreferrer"
            >
              docker-compose
            </a>{' '}
            format manifests for Kubernetes deployments, and we have removed the{' '}
            <a href="https://kompose.io/" target="_blank" rel="noreferrer">
              Kompose
            </a>{' '}
            conversion tool which enables this. The reason for this is because
            Kompose now poses a security risk, since it has a number of Common
            Vulnerabilities and Exposures (CVEs).
          </p>
          <p>
            Unfortunately, while the Kompose project has a maintainer and is
            part of the CNCF, it is not being actively maintained. Releases are
            very infrequent and new pull requests to the project (including ones
            we&apos;ve submitted) are taking months to be merged, with new CVEs
            arising in the meantime.
          </p>
          <p>
            We advise installing your own instance of Kompose in a sandbox
            environment, performing conversions of your Docker Compose files to
            Kubernetes manifests and using those manifests to set up
            applications.
          </p>
        </TextTip>
      )}
      {!isComposeFormat && (
        <TextTip color="blue">
          <p>
            This feature allows you to deploy any kind of Kubernetes resource in
            this environment (Deployment, Secret, ConfigMap...).
          </p>
          <p>
            You can get more information about Kubernetes file format in the{' '}
            <a
              href="https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/"
              target="_blank"
              rel="noreferrer"
            >
              official documentation
            </a>
            .
          </p>
        </TextTip>
      )}
    </>
  );
}
