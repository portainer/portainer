import { getGitRepoCommitUrl } from '@/react/portainer/gitops/utils';

interface Props {
  baseURL: string;
  commitHash: string;
}

export function GitCommitLink({ baseURL, commitHash }: Props) {
  return (
    <a
      href={`${getGitRepoCommitUrl(baseURL, commitHash)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {commitHash.slice(0, 7)}
    </a>
  );
}
