import { matchLabelsToLabelSelectorValue } from './utils';

describe('matchLabelsToLabelSelectorValue', () => {
  it('returns an empty string when no selector is given', () => {
    expect(matchLabelsToLabelSelectorValue(undefined)).toBe('');
  });

  it('serializes matchLabels as key=value pairs', () => {
    expect(
      matchLabelsToLabelSelectorValue({ matchLabels: { app: 'steed' } })
    ).toBe('app=steed');
  });

  it('serializes matchExpressions alongside matchLabels', () => {
    expect(
      matchLabelsToLabelSelectorValue({
        matchLabels: { app: 'steed' },
        matchExpressions: [
          { key: 'project', operator: 'In', values: ['steed'] },
          { key: 'tier', operator: 'NotIn', values: ['legacy', 'canary'] },
          { key: 'monitored', operator: 'Exists' },
          { key: 'deprecated', operator: 'DoesNotExist' },
        ],
      })
    ).toBe(
      'app=steed,project in (steed),tier notin (legacy,canary),monitored,!deprecated'
    );
  });

  it('serializes matchExpressions when there are no matchLabels', () => {
    expect(
      matchLabelsToLabelSelectorValue({
        matchExpressions: [
          { key: 'project', operator: 'In', values: ['steed'] },
        ],
      })
    ).toBe('project in (steed)');
  });
});
