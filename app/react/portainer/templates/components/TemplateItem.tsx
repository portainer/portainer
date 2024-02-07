import { ReactNode } from 'react';
import { Rocket } from 'lucide-react';

import LinuxIcon from '@/assets/ico/linux.svg?c';
import MicrosoftIcon from '@/assets/ico/vendor/microsoft.svg?c';
import KubernetesIcon from '@/assets/ico/vendor/kubernetes.svg?c';

import { Icon } from '@@/Icon';
import { FallbackImage } from '@@/FallbackImage';
import { BlocklistItem } from '@@/Blocklist/BlocklistItem';
import { BadgeIcon } from '@@/BadgeIcon';
import { Link } from '@@/Link';

import { Platform } from '../types';

type Value = {
  Id: number | string;
  Logo?: string;
  Title: string;
  Platform?: Platform;
  Description: string;
  Categories?: string[];
};

export function TemplateItem({
  template,
  typeLabel,
  onSelect,
  renderActions,
  isSelected,
  linkParams,
}: {
  template: Value;
  typeLabel: string;
  onSelect: () => void;
  renderActions: ReactNode;
  isSelected: boolean;
  linkParams?: { to: string; params: object };
}) {
  return (
    <div className="relative">
      <BlocklistItem
        isSelected={isSelected}
        onClick={() => onSelect()}
        as={linkParams ? Link : undefined}
        to={linkParams?.to}
        params={linkParams?.params}
        aria-label={template.Title}
      >
        <div className="vertical-center min-w-[56px] justify-center">
          <FallbackImage
            src={template.Logo}
            fallbackIcon={<BadgeIcon icon={Rocket} size="3xl" />}
            className="blocklist-item-logo"
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
            <span className="blocklist-item-desc">{template.Description}</span>
            {template.Categories && template.Categories.length > 0 && (
              <span className="small text-muted">
                {template.Categories.join(', ')}
              </span>
            )}
          </div>
        </div>
      </BlocklistItem>
      <span className="absolute inset-y-0 right-0 justify-end">
        {renderActions}
      </span>
    </div>
  );
}
