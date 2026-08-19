import React from 'react';

import { FallbackImage } from '@/react/components/FallbackImage';

import { Chart } from '../types';

import { HelmIcon } from './HelmIcon';

interface HelmTemplatesListItemProps {
  model: Chart;
  onSelect: (model: Chart) => void;
  actions?: React.ReactNode;
}

export function HelmTemplatesListItem(props: HelmTemplatesListItemProps) {
  const { model, onSelect, actions } = props;

  function handleSelect() {
    onSelect(model);
  }

  return (
    <button
      type="button"
      className="blocklist-item !mx-0 bg-inherit text-start"
      onClick={handleSelect}
      tabIndex={0}
    >
      <div className="blocklist-item-box">
        <span className="shrink-0">
          <FallbackImage
            src={model.icon}
            fallbackIcon={HelmIcon}
            className="blocklist-item-logo h-16 w-auto"
            alt="Helm chart icon"
          />
        </span>

        <div className="col-sm-12 flex flex-wrap justify-between gap-2">
          <div className="blocklist-item-line">
            <div>
              <div className="blocklist-item-title">{model.name}</div>
              <div className="small text-muted mt-1">{model.repo}</div>
            </div>
          </div>

          <span className="blocklist-item-actions">{actions}</span>

          <div className="blocklist-item-line w-full">
            <span className="blocklist-item-desc">{model.description}</span>
            {model.annotations?.category && (
              <span className="small text-muted">
                {model.annotations.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
