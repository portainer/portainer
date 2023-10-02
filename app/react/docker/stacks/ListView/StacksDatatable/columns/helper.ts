import { createColumnHelper } from '@tanstack/react-table';

import { DecoratedStack } from '../types';

export const columnHelper = createColumnHelper<DecoratedStack>();

export const getGitCommitUrl = (gitObj: { URL: string; ConfigHash: string}): string => {
  if (gitObj == null) {
    return '';
  }

  const urlPaths = [gitObj.URL];
  const isBitbucket = gitObj.URL.indexOf('bitbucket.org') !== -1;
  urlPaths.push(isBitbucket ? 'commits' : 'commit');
  urlPaths.push(gitObj.ConfigHash);

  return urlPaths.join('/');
};
