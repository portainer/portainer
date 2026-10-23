import { Cylinder, Radio } from 'lucide-react';

import GitIcon from '@/assets/ico/git.svg?c';
import HelmIcon from '@/assets/ico/helm.svg?c';

import { BoxSelectorOption } from '@@/BoxSelector';

const git: BoxSelectorOption<'git'> = {
  id: 'git',
  label: 'Git Repository',
  value: 'git',
  icon: GitIcon,
  iconType: 'logo',
  description: Description({
    txt: 'Connect to a Git repository (GitHub, Gitlab, Bitbucket, etc) to pull configurations files, manifests, and other deployment assets.',
    items: ['Branch & tag selection', 'SSH or HTTPS auth', 'Webhook support'],
  }),
};

const helm: BoxSelectorOption<'helm'> = {
  id: 'helm',
  value: 'helm',
  label: 'Helm Repository',
  icon: HelmIcon,
  iconType: 'logo',
  description: Description({
    txt: 'Connect to a Helm chart repository to deploy and manage Helm charts across your environments.',
    items: [
      'Chart versioning',
      'Values customization',
      'Dependency management',
    ],
  }),
  disabled: true,
};

const registry: BoxSelectorOption<'registry'> = {
  id: 'registry',
  value: 'registry',
  label: 'OCI Registry',
  icon: Radio,
  description: Description({
    txt: 'Connect to an OCI-compliant container registry to pull artifacts and container images.',
    items: [
      'Image tags & digests',
      'Private registry auth',
      'Artifact support',
    ],
  }),
  disabled: true,
};

const s3: BoxSelectorOption<'s3'> = {
  id: 's3',
  value: 's3',
  label: 'S3 Bucket',
  icon: Cylinder,
  description: Description({
    txt: 'Connect to an S3-compatible bucket (AWS, S3, MinIO, etc) to fetch configuration files and assets.',
    items: ['Prefix filtering', 'IAM or key auth', 'Version support'],
  }),
  disabled: true,
};

export const sourceTypeOptions = [git, helm, registry, s3];

function Description({ txt, items }: { txt: string; items: string[] }) {
  return (
    <div>
      {txt}
      <div className="pl-4 pt-2">
        <ul>
          {items.map((v, k) => (
            <li key={k}>{v}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
