import { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

import {
  ResourceStatBlock,
  ResourceStatBlockStatus,
} from './ResourceStatBlock';

type ValueProps = ComponentProps<typeof ResourceStatBlock.Value>;
type ValueSize = NonNullable<ValueProps['size']>;
type ValueAlign = NonNullable<ValueProps['align']>;

interface RenderOptions {
  status?: ResourceStatBlockStatus;
  labelIcon?: ReactNode;
  value?: ReactNode;
  valueSuffix?: ReactNode;
  valueDot?: boolean;
  valueSize?: ValueSize;
  valueAlign?: ValueAlign;
  meta?: ReactNode;
}

function renderComponent({
  status,
  labelIcon,
  value = 'Synced',
  valueSuffix,
  valueDot,
  valueSize,
  valueAlign,
  meta,
}: RenderOptions = {}) {
  return render(
    <ResourceStatBlock status={status} data-cy="stat-block">
      <ResourceStatBlock.Label icon={labelIcon}>
        Sync Status
      </ResourceStatBlock.Label>
      <ResourceStatBlock.Value
        dot={valueDot}
        suffix={valueSuffix}
        size={valueSize}
        align={valueAlign}
      >
        {value}
      </ResourceStatBlock.Value>
      {meta && <ResourceStatBlock.Meta>{meta}</ResourceStatBlock.Meta>}
    </ResourceStatBlock>
  );
}

describe('ResourceStatBlock', () => {
  it('should render the label and value', () => {
    renderComponent();

    expect(screen.getByText('Sync Status')).toBeVisible();
    expect(screen.getByText('Synced')).toBeVisible();
  });

  it('should render the icon when provided to Label', () => {
    renderComponent({ labelIcon: <span data-cy="stat-icon">i</span> });

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('should render the suffix when provided to Value', () => {
    renderComponent({ valueSuffix: 'healthy' });

    expect(screen.getByText('healthy')).toBeVisible();
  });

  it('should omit the suffix when not provided', () => {
    renderComponent();

    expect(screen.queryByText('healthy')).not.toBeInTheDocument();
  });

  it('should render the meta line when provided', () => {
    renderComponent({ meta: 'Last reconciled 2 min ago' });

    expect(screen.getByText('Last reconciled 2 min ago')).toBeVisible();
  });

  it('should omit the meta line when not provided', () => {
    renderComponent();

    expect(
      screen.queryByText('Last reconciled 2 min ago')
    ).not.toBeInTheDocument();
  });

  describe('dot', () => {
    it('should not render a dot by default', () => {
      renderComponent();

      expect(screen.queryByTestId('stat-block-dot')).not.toBeInTheDocument();
    });

    it('should render a dot inheriting the container status when dot is true', () => {
      renderComponent({ valueDot: true, status: 'success' });

      expect(screen.getByTestId('stat-block-dot')).toHaveClass('bg-green-7');
    });
  });

  describe('status variants', () => {
    const containerCases: Array<[ResourceStatBlockStatus, string]> = [
      ['success', 'border-green-4'],
      ['danger', 'border-error-4'],
      ['warning', 'border-warning-4'],
      ['pending', 'border-blue-4'],
      ['muted', 'border-gray-4'],
    ];

    it.each(containerCases)(
      'should apply the %s container styling',
      (status, expectedClass) => {
        renderComponent({ status });

        expect(screen.getByTestId('stat-block')).toHaveClass(expectedClass);
      }
    );

    const valueCases: Array<[ResourceStatBlockStatus, string]> = [
      ['success', 'text-green-8'],
      ['danger', 'text-error-8'],
      ['warning', 'text-warning-8'],
      ['pending', 'text-blue-8'],
      ['muted', 'text-graphite-700'],
    ];

    it.each(valueCases)(
      'should apply the %s value text color',
      (status, expectedClass) => {
        renderComponent({ status });

        expect(screen.getByText('Synced')).toHaveClass(expectedClass);
      }
    );

    it('should default to muted styling when status is omitted', () => {
      renderComponent();

      expect(screen.getByTestId('stat-block')).toHaveClass('border-gray-4');
      expect(screen.getByText('Synced')).toHaveClass('text-graphite-700');
    });
  });

  describe('Value align', () => {
    const cases: Array<[ValueAlign, string]> = [
      ['start', 'justify-start'],
      ['center', 'justify-center'],
      ['end', 'justify-end'],
    ];

    it.each(cases)(
      'should align the value row to %s',
      (align, expectedClass) => {
        renderComponent({ valueAlign: align });

        expect(screen.getByText('Synced').parentElement).toHaveClass(
          expectedClass
        );
      }
    );

    it('should default to start alignment', () => {
      renderComponent();

      expect(screen.getByText('Synced').parentElement).toHaveClass(
        'justify-start'
      );
    });
  });

  describe('Value size', () => {
    const cases: Array<[ValueSize, string]> = [
      ['xs', 'text-xs'],
      ['sm', 'text-sm'],
      ['base', 'text-base'],
      ['lg', 'text-lg'],
    ];

    it.each(cases)(
      'should size the value text as %s',
      (size, expectedClass) => {
        renderComponent({ valueSize: size });

        expect(screen.getByText('Synced')).toHaveClass(expectedClass);
      }
    );

    it('should default to xs sizing', () => {
      renderComponent();

      expect(screen.getByText('Synced')).toHaveClass('text-xs');
    });
  });
});
