import { Edit, FileText, Globe, UploadCloud } from 'lucide-react';

import GitIcon from '@/assets/ico/git.svg?c';

import { BoxSelectorOption } from '../types';

export const editor: BoxSelectorOption<'editor'> = {
  id: 'method_editor',
  icon: Edit,
  iconType: 'badge',
  label: 'Web editor',
  description: 'Use our Web editor',
  value: 'editor',
};

export const upload: BoxSelectorOption<'upload'> = {
  id: 'method_upload',
  icon: UploadCloud,
  iconType: 'badge',
  label: 'Upload',
  description: 'Upload from your computer',
  value: 'upload',
};

export const git: BoxSelectorOption<'repository'> = {
  id: 'method_repository',
  icon: GitIcon,
  iconType: 'logo',
  label: 'Repository',
  description: 'Use a git repository',
  value: 'repository',
};

export const edgeStackTemplate: BoxSelectorOption<'template'> = {
  id: 'method_template',
  icon: FileText,
  iconType: 'badge',
  label: 'Template',
  description: 'Use an Edge stack template',
  value: 'template',
};

export const customTemplate: BoxSelectorOption<'template'> = {
  id: 'method_template',
  icon: FileText,
  iconType: 'badge',
  label: 'Custom template',
  description: 'Use a custom template',
  value: 'template',
};

export const url: BoxSelectorOption<'url'> = {
  id: 'method_url',
  icon: Globe,
  iconType: 'badge',
  label: 'URL',
  description: 'Specify a URL to a file',
  value: 'url',
};
