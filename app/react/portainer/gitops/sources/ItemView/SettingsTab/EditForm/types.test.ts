import { validationSchema } from './types';

const baseValues = {
  name: 'my-source',
  url: 'https://github.com/org/repo.git',
  tlsSkipVerify: false,
  authEnabled: false,
  username: '',
  password: '',
};

describe('validationSchema polling/interval', () => {
  it('fails when polling is enabled without an interval', async () => {
    const result = await validationSchema.isValid({
      ...baseValues,
      pollingEnabled: true,
      interval: '',
    });
    expect(result).toBe(false);
  });

  it('passes when polling is enabled with a valid interval', async () => {
    const result = await validationSchema.isValid({
      ...baseValues,
      pollingEnabled: true,
      interval: '5m',
    });
    expect(result).toBe(true);
  });

  it('passes when polling is disabled regardless of interval', async () => {
    const result = await validationSchema.isValid({
      ...baseValues,
      pollingEnabled: false,
      interval: '',
    });
    expect(result).toBe(true);
  });

  it('passes when polling is disabled and interval is undefined, as Formik casts an empty string to undefined before validating', async () => {
    const result = await validationSchema.isValid({
      ...baseValues,
      pollingEnabled: false,
      interval: undefined,
    });
    expect(result).toBe(true);
  });
});
