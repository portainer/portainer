import { LayoutGrid } from 'lucide-react';

import Linux from '@/assets/ico/linux.svg?c';

import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { Icon } from '@@/Icon';

import { OS } from './types';

interface Props {
  value: OS;
  onChange(value: OS): void;
}

export function OsSelector({ onChange, value }: Props) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <ButtonSelector
          size="small"
          value={value}
          onChange={(os: OS) => onChange(os)}
          options={[
            {
              value: 'linux',
              label: (
                <>
                  <Icon icon={Linux} className="mr-1" />
                  Linux
                </>
              ),
            },
            {
              value: 'win',
              label: (
                <>
                  <Icon icon={LayoutGrid} className="mr-1" />
                  Windows
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
