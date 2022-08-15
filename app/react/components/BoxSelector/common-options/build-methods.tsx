import { Edit, FileText, Globe, Upload } from 'react-feather';

import GitIcon from '@/assets/ico/git.svg?c';

import { BadgeIcon } from '../BadgeIcon';
import { BoxSelectorOption } from '../types';

export const editor: BoxSelectorOption<'editor'> = {
  id: 'method_editor',
  icon: <BadgeIcon icon={Edit} />,
  label: 'Web editor',
  description: 'Use our Web editor',
  value: 'editor',
};
export const upload: BoxSelectorOption<'upload'> = {
  id: 'method_upload',
  icon: <BadgeIcon icon={Upload} />,
  label: 'Upload',
  description: 'Upload from your computer',
  value: 'upload',
};
export const git: BoxSelectorOption<'repository'> = {
  id: 'method_repository',
  icon: <GitIcon />,
  label: 'Repository',
  description: 'Use a git repository',
  value: 'repository',
};

export const template: BoxSelectorOption<'template'> = {
  id: 'method_template',
  icon: <BadgeIcon icon={FileText} />,
  label: 'Template',
  description: 'Use an Edge stack template',
  value: 'template',
};

export const url: BoxSelectorOption<'url'> = {
  id: 'method_url',
  icon: <BadgeIcon icon={Globe} />,
  label: 'URL',
  description: 'Specify a URL to a file',
  value: 'url',
};
