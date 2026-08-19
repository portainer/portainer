import { buildUpdatePayload } from './payload';
import { SettingsFormValues } from './types';

const baseValues: SettingsFormValues = {
  name: 'my-source',
  url: 'https://github.com/org/repo.git',
  tlsSkipVerify: false,
  authEnabled: false,
  username: '',
  password: '',
  pollingEnabled: false,
  interval: '',
};

describe('buildUpdatePayload interval handling', () => {
  it('omits interval when polling settings are unchanged', () => {
    const payload = buildUpdatePayload(baseValues, baseValues);
    expect(payload.interval).toBeUndefined();
  });

  it('sends the interval when polling is newly enabled', () => {
    const values: SettingsFormValues = {
      ...baseValues,
      pollingEnabled: true,
      interval: '5m',
    };
    const payload = buildUpdatePayload(values, baseValues);
    expect(payload.interval).toBe('5m');
  });

  it('sends an empty interval when polling is disabled', () => {
    const initialValues: SettingsFormValues = {
      ...baseValues,
      pollingEnabled: true,
      interval: '5m',
    };
    const values: SettingsFormValues = {
      ...initialValues,
      pollingEnabled: false,
    };
    const payload = buildUpdatePayload(values, initialValues);
    expect(payload.interval).toBe('');
  });

  it('sends the updated interval when the value changes while enabled', () => {
    const initialValues: SettingsFormValues = {
      ...baseValues,
      pollingEnabled: true,
      interval: '5m',
    };
    const values: SettingsFormValues = { ...initialValues, interval: '10m' };
    const payload = buildUpdatePayload(values, initialValues);
    expect(payload.interval).toBe('10m');
  });
});
