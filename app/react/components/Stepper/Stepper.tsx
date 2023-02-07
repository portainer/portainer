import clsx from 'clsx';

import styles from './Stepper.module.css';

export interface Step {
  label: string;
}

interface Props {
  currentStep: number;
  steps: Step[];
}

export function Stepper({ currentStep, steps }: Props) {
  return (
    <div className={styles.stepperWrapper}>
      {steps.map((step, index) => (
        <div
          key={step.label}
          className={clsx(styles.stepWrapper, {
            [styles.active]: index + 1 === currentStep,
            [styles.completed]: index + 1 < currentStep,
          })}
        >
          <div className={styles.step}>
            <div className={styles.stepCounter}>{index + 1}</div>
            <div className={styles.stepName}>{step.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
