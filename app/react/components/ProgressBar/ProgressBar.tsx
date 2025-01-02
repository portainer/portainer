import clsx from 'clsx';

type Step = { value: number; color?: string; className?: string };
type StepWithPercent = Step & { percent: number };
interface Props {
  steps: Array<Step>;
  total: number;
  className?: string;
}

export function ProgressBar({ steps, total, className }: Props) {
  const { steps: reducedSteps } = steps.reduce<{
    steps: Array<StepWithPercent>;
    total: number;
    totalPercent: number;
  }>(
    (acc, cur) => {
      const value =
        acc.total + cur.value > total ? total - acc.total : cur.value;
      // If the remaining acc.total + the current value adds up to the total, then make sure the percentage will fill the remaining bar space
      const percent =
        acc.total + value === total
          ? 100 - acc.totalPercent
          : Math.floor((value / total) * 100);
      return {
        steps: [
          ...acc.steps,
          {
            ...cur,
            value,
            percent,
          },
        ],
        total: acc.total + value,
        totalPercent: acc.totalPercent + percent,
      };
    },
    { steps: [], total: 0, totalPercent: 0 }
  );

  const sum = steps.reduce((sum, s) => sum + s.value, 0);

  return (
    <div
      className={clsx(
        'progress shadow-none h-2.5 rounded-full',
        sum > 100 ? 'text-blue-8' : 'text-error-7',
        className
      )}
      aria-valuemin={0}
      aria-valuemax={100}
      role="progressbar"
    >
      {reducedSteps.map((step, index) => (
        <div
          key={index}
          className={clsx('progress-bar shadow-none', step.className)}
          style={{
            width: `${step.percent}%`,
            backgroundColor: step.color,
          }}
        />
      ))}
    </div>
  );
}
