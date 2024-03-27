import { ReactNode, useState } from 'react';

import { AutomationTestingProps } from '@/types';

import { SwitchField } from '@@/form-components/SwitchField';

import { ModalType, type ButtonOptions } from './types';
import { openModal } from './open-modal';
import { OnSubmit } from './Modal/types';
import { Dialog } from './Dialog';
import { buildCancelButton, buildConfirmButton } from './utils';

function SwitchPrompt({
  onSubmit,
  title,
  confirmButton = buildConfirmButton('OK'),
  switchLabel,
  modalType,
  message,
  defaultValue = false,
  'data-cy': dataCy,
}: {
  onSubmit: OnSubmit<{ value: boolean }>;
  title: string;
  switchLabel: string;
  confirmButton?: ButtonOptions<true>;
  modalType?: ModalType;
  message?: ReactNode;
  defaultValue?: boolean;
} & AutomationTestingProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Dialog
      modalType={modalType}
      title={title}
      message={
        <>
          {message && <div className="mb-3">{message}</div>}
          <SwitchField
            name="value"
            data-cy={dataCy}
            label={switchLabel}
            checked={value}
            onChange={setValue}
          />
        </>
      }
      onSubmit={(confirm) => onSubmit(confirm ? { value } : undefined)}
      buttons={[buildCancelButton(), confirmButton]}
    />
  );
}

export async function openSwitchPrompt(
  title: string,
  switchLabel: string,
  {
    confirmButton,
    modalType,
    message,
    defaultValue,
    'data-cy': dataCy,
  }: {
    confirmButton?: ButtonOptions<true>;
    modalType?: ModalType;
    message?: ReactNode;
    defaultValue?: boolean;
  } & AutomationTestingProps = {
    'data-cy': 'switch-prompt',
  }
) {
  return openModal(SwitchPrompt, {
    confirmButton,
    title,
    switchLabel,
    modalType,
    message,
    defaultValue,
    'data-cy': dataCy,
  });
}
