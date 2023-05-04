import _ from 'lodash';
import { useState, useEffect } from 'react';

import { useSettings } from '@/react/portainer/settings/queries';

type Option = {
  label: string;
  value: number;
};

type DefaultOption = Option & { isDefault: true };

export type Options = [DefaultOption, ...Option[]];

export function useIntervalOptions(
  fieldName:
    | 'Edge.PingInterval'
    | 'Edge.SnapshotInterval'
    | 'Edge.CommandInterval'
    | 'EdgeAgentCheckinInterval',
  initialOptions: Options,
  isDefaultHidden: boolean
) {
  const [{ value: defaultValue }] = initialOptions;
  const [options, setOptions] = useState<Option[]>(initialOptions);

  const settingsQuery = useSettings(
    (settings) => _.get(settings, fieldName, 0) as number,
    !isDefaultHidden
  );

  useEffect(() => {
    if (isDefaultHidden) {
      setOptions(initialOptions.slice(1));
    }

    if (
      !isDefaultHidden &&
      typeof settingsQuery.data !== 'undefined' &&
      settingsQuery.data !== defaultValue
    ) {
      setOptions((options) => {
        let label = `${settingsQuery.data} seconds`;
        const option = options.find((o) => o.value === settingsQuery.data);
        if (option) {
          label = option.label;
        }

        return [
          {
            value: defaultValue,
            label: `Use default interval (${label})`,
          },
          ...options.slice(1),
        ];
      });
    }
  }, [
    settingsQuery.data,
    setOptions,
    isDefaultHidden,
    initialOptions,
    defaultValue,
  ]);

  return options;
}
