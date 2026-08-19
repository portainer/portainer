import clsx from 'clsx';
import { Check } from 'lucide-react';

import { Icon } from '@@/Icon';

export interface StepData {
  label: string;
  /** Allow this step to be clicked even when it hasn't been reached yet */
  enabled?: boolean;
}

interface Props {
  step: StepData;
  index: number;
  currentStepIndex: number;
  isLast: boolean;
  onStepClick?: (stepIndex: number) => void;
}

type StepStateLabel = 'completed' | 'current' | 'upcoming';

interface StepState {
  isActive: boolean;
  isCompleted: boolean;
  isClickable?: boolean;
}

export function Step({
  step,
  index,
  currentStepIndex,
  isLast,
  onStepClick,
}: Props) {
  const isActive = index === currentStepIndex;
  const isCompleted = index < currentStepIndex;
  const isClickable = !!onStepClick && (isCompleted || !!step.enabled);
  const displayNumber = index + 1;
  const stepState = getStepState({ isActive, isCompleted });

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => isClickable && onStepClick?.(index)}
        disabled={!isClickable}
        className={getButtonClasses({
          isActive,
          isCompleted,
          isClickable,
        })}
        aria-label={`Step ${displayNumber}: ${step.label}, ${stepState}`}
        aria-current={isActive ? 'step' : undefined}
        data-cy={`stepper-step-${index}`}
        data-step-state={stepState}
      >
        <span className={getBadgeClasses({ isCompleted })} aria-hidden="true">
          {isCompleted ? <Icon icon={Check} size="xs" /> : displayNumber}
        </span>
        <span className="whitespace-nowrap text-sm">{step.label}</span>
      </button>

      {!isLast && (
        <div
          className={getConnectorClasses({ isCompleted })}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function getStepState({
  isActive,
  isCompleted,
}: Pick<StepState, 'isActive' | 'isCompleted'>): StepStateLabel {
  if (isCompleted) {
    return 'completed';
  }
  if (isActive) {
    return 'current';
  }
  return 'upcoming';
}

function getButtonClasses({ isActive, isCompleted, isClickable }: StepState) {
  return clsx(
    'flex items-center gap-2 rounded-lg border border-solid px-3 py-2 font-medium text-inherit transition-all',
    getButtonStateClasses({ isActive, isCompleted }),
    isClickable
      ? clsx(
          'cursor-pointer hover:border-blue-6 hover:bg-blue-3',
          'th-dark:hover:border-blue-5 th-dark:hover:bg-blue-9/30',
          'th-highcontrast:hover:border-blue-4 th-highcontrast:hover:bg-blue-9/40'
        )
      : 'cursor-default'
  );
}

function getButtonStateClasses({
  isActive,
  isCompleted,
}: Omit<StepState, 'isClickable'>) {
  if (isActive) {
    return clsx(
      'border-blue-6 bg-blue-2',
      'th-dark:border-blue-7 th-dark:bg-blue-10',
      'th-highcontrast:border-blue-7 th-highcontrast:bg-blue-10'
    );
  }

  if (isCompleted) {
    return clsx(
      'border-graphite-700 bg-graphite-700/5',
      'th-dark:border-gray-warm-5 th-dark:bg-gray-warm-9',
      'th-highcontrast:border-gray-4 th-highcontrast:bg-gray-9'
    );
  }

  return clsx(
    'border-gray-5 bg-white',
    'th-dark:border-gray-warm-7 th-dark:bg-gray-iron-10',
    'th-highcontrast:border-gray-2 th-highcontrast:bg-black'
  );
}

function getBadgeClasses({ isCompleted }: Pick<StepState, 'isCompleted'>) {
  const base = 'flex h-6 w-6 items-center justify-center rounded-full text-xs';

  if (isCompleted) {
    return clsx(
      base,
      'bg-graphite-700 text-mist-100',
      'th-dark:bg-gray-warm-5 th-dark:text-gray-iron-10',
      'th-highcontrast:bg-gray-4 th-highcontrast:text-black'
    );
  }

  return clsx(
    base,
    'bg-gray-4 text-gray-7',
    'th-dark:bg-gray-warm-7 th-dark:text-white',
    'th-highcontrast:bg-gray-8 th-highcontrast:text-white'
  );
}

function getConnectorClasses({ isCompleted }: Pick<StepState, 'isCompleted'>) {
  const base = 'h-0.5 w-8 transition-colors';

  if (isCompleted) {
    return clsx(
      base,
      'bg-graphite-700',
      'th-dark:bg-gray-warm-5',
      'th-highcontrast:bg-gray-4'
    );
  }

  return clsx(
    base,
    'bg-gray-5',
    'th-dark:bg-gray-warm-7',
    'th-highcontrast:bg-gray-6'
  );
}
