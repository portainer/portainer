import { Edit, FileText, Globe, UploadCloud } from 'lucide-react';

import GitIcon from '@/assets/ico/git.svg?c';
import Helm from '@/assets/ico/helm.svg?c';

import { BoxSelectorOption } from '../types';

export const editor: BoxSelectorOption<'editor'> = {
  id: 'method_editor',
  icon: Edit,
  iconType: 'badge',
  label: 'Web editor',
  value: 'editor',
};

export const upload: BoxSelectorOption<'upload'> = {
  id: 'method_upload',
  icon: UploadCloud,
  iconType: 'badge',
  label: 'Upload',
  value: 'upload',
};

export const git: BoxSelectorOption<'repository'> = {
  id: 'method_repository',
  icon: GitIcon,
  iconType: 'logo',
  label: 'Repository',
  value: 'repository',
};

export const edgeStackTemplate: BoxSelectorOption<'template'> = {
  id: 'method_template',
  icon: FileText,
  iconType: 'badge',
  label: 'Template',
  description: 'Use an Edge stack app or custom template',
  value: 'template',
};

export const customTemplate: BoxSelectorOption<'template'> = {
  id: 'method_template',
  icon: FileText,
  iconType: 'badge',
  label: 'Custom template',
  value: 'template',
};

export const helm: BoxSelectorOption<'helm'> = {
  id: 'method_helm',
  icon: Helm,
  label: 'Helm chart',
  value: 'helm',
  iconClass: '!text-[#0f1689] th-dark:!text-white th-highcontrast:!text-white',
};

export const url: BoxSelectorOption<'url'> = {
  id: 'method_url',
  icon: Globe,
  iconType: 'badge',
  label: 'URL',
  value: 'url',
};
