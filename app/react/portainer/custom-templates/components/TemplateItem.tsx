import { ReactNode } from 'react';
import clsx from 'clsx'; // Import the clsx library

import LinuxIcon from '@/assets/ico/linux.svg?c';
import MicrosoftIcon from '@/assets/ico/vendor/microsoft.svg?c';
import KubernetesIcon from '@/assets/ico/vendor/kubernetes.svg?c';

import { Icon } from '@@/Icon';
import { FallbackImage } from '@@/FallbackImage';

import { Platform } from '../types';

// Import the Icon component
type Value = {
  Id: number;
  Logo: string;
  Title: string;
  Platform: Platform;
  Description: string;
  Categories?: string[];
};

export function TemplateItem({
  template,
  typeLabel,
  onSelect,
  renderActions,
  isSelected,
}: {
  template: Value;
  typeLabel: string;
  onSelect: () => void;
  renderActions: ReactNode;
  isSelected: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={clsx('blocklist-item w-full !ml-0 btn-none', {
          'blocklist-item--selected': isSelected,
        })}
        onClick={() => onSelect()}
      >
        <div className="blocklist-item-box w-full">
          <div className="vertical-center min-w-[56px] justify-center">
            <FallbackImage
              src={template.Logo}
              fallbackIcon="rocket"
              className="blocklist-item-logo"
              size="3xl"
            />
          </div>
          <div className="col-sm-12 flex justify-between flex-wrap">
            <div className="blocklist-item-line gap-2">
              <span className="blocklist-item-title">{template.Title}</span>
              <div className="space-left blocklist-item-subtitle inline-flex items-center">
                <div className="vertical-center gap-1">
                  {(template.Platform === Platform.LINUX ||
                    !template.Platform) && (
                    <Icon icon={LinuxIcon} className="mr-1" />
                  )}
                  {(template.Platform === Platform.WINDOWS ||
                    !template.Platform) && (
                    <Icon
                      icon={MicrosoftIcon}
                      className="[&>*]:flex [&>*]:items-center"
                      size="lg"
                    />
                  )}
                </div>
                {typeLabel === 'manifest' && (
                  <div className="vertical-center">
                    <Icon
                      icon={KubernetesIcon}
                      size="lg"
                      className="align-bottom [&>*]:flex [&>*]:items-center"
                    />
                  </div>
                )}
                {typeLabel}
              </div>
            </div>
            <div className="blocklist-item-line w-full">
              <span className="blocklist-item-desc">
                {template.Description}
              </span>
              {template.Categories && template.Categories.length > 0 && (
                <span className="small text-muted">
                  {template.Categories.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
      <span className="absolute inset-y-0 right-0 justify-end">
        {renderActions}
      </span>
    </div>
  );
}
