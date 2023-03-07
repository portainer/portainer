import { ReactNode, useEffect, useState, useRef } from 'react';

import { Button } from '@@/buttons';

import { ButtonOptions, ModalType } from './types';
import { openModal } from './open-modal';
import { Modal, OnSubmit } from './Modal';

export interface DialogOptions<T> {
  title?: ReactNode;
  message: ReactNode;
  modalType?: ModalType;
  buttons: Array<ButtonOptions<T>>;
}

interface Props<T> extends DialogOptions<T> {
  onSubmit: OnSubmit<T>;
}

export function Dialog<T>({
  buttons,
  message,
  title,
  onSubmit,
  modalType,
}: Props<T>) {
  const ariaLabel = requireString(title) || requireString(message) || 'Dialog';

  const [count, setCount] = useState<number>(0);
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    let retFn;

    // only countdown the first button with non-zero timeout
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      if (button.timeout) {
        setCount(button.timeout as number);

        const intervalID = setInterval(() => {
          const count = countRef.current;

          setCount(count - 1);
          if (count === 1) {
            onSubmit(button.value);
          }
        }, 1000);

        retFn = () => clearInterval(intervalID);

        break;
      }
    }

    return retFn;
  }, [buttons, onSubmit]);

  return (
    <Modal onDismiss={() => onSubmit()} aria-label={ariaLabel}>
      {title && <Modal.Header title={title} modalType={modalType} />}
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        {buttons.map((button, index) => (
          <Button
            onClick={() => onSubmit(button.value)}
            className={button.className}
            color={button.color}
            key={index}
            size="medium"
          >
            {button.label} {button.timeout && count ? `(${count})` : null}
          </Button>
        ))}
      </Modal.Footer>
    </Modal>
  );
}

function requireString(value: ReactNode) {
  return typeof value === 'string' ? value : undefined;
}

export async function openDialog<T>(options: DialogOptions<T>) {
  return openModal<DialogOptions<T>, T>(Dialog, options);
}
