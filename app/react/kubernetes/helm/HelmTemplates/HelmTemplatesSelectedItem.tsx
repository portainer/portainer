import { X } from 'lucide-react';

import { Widget } from '@@/Widget';
import { Button } from '@@/buttons/Button';
import { FallbackImage } from '@@/FallbackImage';
import { Icon } from '@@/Icon';

import { Chart } from '../types';

import { HelmIcon } from './HelmIcon';

type Props = {
  selectedChart: Chart;
  clearHelmChart: () => void;
};

export function HelmTemplatesSelectedItem({
  selectedChart,
  clearHelmChart,
}: Props) {
  return (
    <Widget>
      <div className="flex">
        <div className="m-2 basis-3/4 rounded-lg bg-gray-4 th-highcontrast:bg-black th-highcontrast:text-white th-dark:bg-gray-iron-10 th-dark:text-white">
          <div className="vertical-center p-5">
            <FallbackImage
              src={selectedChart.icon}
              fallbackIcon={HelmIcon}
              className="h-16 w-16 flex-none"
            />
            <div className="col-sm-12">
              <div>
                <div className="text-2xl font-bold">{selectedChart.name}</div>
                <div className="small text-muted mt-1">
                  {selectedChart.repo}
                </div>
              </div>
              <div className="mt-2 text-xs">{selectedChart.description}</div>
            </div>
          </div>
        </div>
        <div className="basis-1/4">
          <div className="vertical-center h-full w-full justify-end pr-5">
            <Button
              color="link"
              className="!text-gray-8 hover:no-underline th-highcontrast:!text-white th-dark:!text-white"
              onClick={clearHelmChart}
              data-cy="clear-selection"
            >
              Clear selection
              <Icon icon={X} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </Widget>
  );
}
