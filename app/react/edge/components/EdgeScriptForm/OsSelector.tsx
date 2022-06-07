import { ButtonSelector } from '@/portainer/components/form-components/ButtonSelector/ButtonSelector';

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
                  <i className="fab fa-linux space-right" aria-hidden="true" />
                  Linux
                </>
              ),
            },
            {
              value: 'win',
              label: (
                <>
                  <i
                    className="fab fa-windows space-right"
                    aria-hidden="true"
                  />
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
