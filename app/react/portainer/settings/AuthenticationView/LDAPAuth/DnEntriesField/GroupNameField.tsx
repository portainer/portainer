import { Trash2 } from 'lucide-react';

import { Input } from '@@/form-components/Input';
import { Button } from '@@/buttons';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onRemoveClick?: () => void;
}

export function GroupNameField({
  id,
  value,
  onChange,
  disabled,
  onRemoveClick,
}: Props) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="col-sm-4 control-label text-left">
        Group Name
      </label>
      <div className="col-sm-8">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              id={id}
              data-cy="group-name-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          {onRemoveClick && (
            <Button
              type="button"
              color="danger"
              size="medium"
              onClick={onRemoveClick}
              disabled={disabled}
              icon={Trash2}
              data-cy="group-dn-remove-button"
              title="Remove Group"
              aria-label="Remove Group"
            />
          )}
        </div>
      </div>
    </div>
  );
}
