function cleanGitRepoUrl(url: string) {
  return url
    .trim() // remove leading and trailing whitespace
    .replace(/\/$/, '') // if there's a trailing slash, remove it
    .replace(/\.git$/, ''); // if there's a trailing .git extension, remove it
}

function getGitRepoCommitUrl(url: string, hash: string) {
  const cleanedUrl = cleanGitRepoUrl(url);

  if (cleanedUrl.startsWith('https://bitbucket.org')) {
    return `${cleanedUrl}/commits/${hash}`;
  }

  // this is a fallback for any other git repo
  // the tested repo includes gitlab, github, and azure devops
  return `${cleanedUrl}/commit/${hash}`;
}

interface Props {
  baseURL: string;
  commitHash: string;
}

export function GitCommitLink({ baseURL, commitHash }: Props) {
  return (
    <a
      href={getGitRepoCommitUrl(baseURL, commitHash)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {commitHash.slice(0, 7)}
    </a>
  );
}
