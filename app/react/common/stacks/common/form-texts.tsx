import { StackType } from '../types';

const dockerTexts = {
  editor: {
    placeholder: 'Define or paste the content of your docker compose file here',
    description: (
      <p>
        You can get more information about Compose file format in the{' '}
        <a
          href="https://docs.docker.com/compose/compose-file/"
          target="_blank"
          rel="noreferrer"
        >
          official documentation
        </a>
        .
      </p>
    ),
  },
  upload: 'You can upload a Compose file from your computer.',
} as const;

export const textByType = {
  [StackType.DockerCompose]: dockerTexts,
  [StackType.DockerSwarm]: dockerTexts,
  [StackType.Kubernetes]: {
    editor: {
      placeholder: 'Define or paste the content of your manifest file here',
      description: (
        <>
          <p>
            Templates allow deploying any kind of Kubernetes resource
            (Deployment, Secret, ConfigMap...)
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
        </>
      ),
    },
    upload: 'You can upload a Manifest file from your computer.',
  },
} as const;
