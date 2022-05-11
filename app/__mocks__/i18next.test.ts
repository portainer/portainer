import * as i18nextMocks from './i18next';

describe('mockT', () => {
  it('should return correctly with no arguments', async () => {
    const testText = `The company's new IT initiative, code named Phoenix Project, is critical to the
        future of Parts Unlimited, but the project is massively over budget and very late. The CEO wants
        Bill to report directly to him and fix the mess in ninety days or else Bill's entire department
        will be outsourced.`;

    const translatedText = i18nextMocks.mockT(testText);

    expect(translatedText).toBe(testText);
  });

  test.each`
    testText                            | args                                          | expectedText
    ${'{{fileName}} is invalid.'}       | ${{ fileName: 'example_5.csv' }}              | ${'example_5.csv is invalid.'}
    ${'{{fileName}} {is}.'}             | ${{ fileName: '   ' }}                        | ${'    {is}.'}
    ${'{{number}} of {{total}}'}        | ${{ number: 0, total: 999 }}                  | ${'0 of 999'}
    ${'There was an error:\n{{error}}'} | ${{ error: 'Failed' }}                        | ${'There was an error:\nFailed'}
    ${'Click:{{li}}{{li2}}{{li_3}}'}    | ${{ li: '', li2: 'https://', li_3: '!@#$%' }} | ${'Click:https://!@#$%'}
    ${'{{happy}}😏y✔{{sad}}{{laugh}}'}  | ${{ happy: '😃', sad: '😢', laugh: '🤣' }}    | ${'😃😏y✔😢🤣'}
  `(
    'should return correctly while handling arguments in different scenarios',
    ({ testText, args, expectedText }) => {
      const translatedText = i18nextMocks.mockT(testText, args);

      expect(translatedText).toBe(expectedText);
    }
  );
});

describe('language', () => {
  it('should return language', async () => {
    const { language } = i18nextMocks.default;

    expect(language).toBe('en');
  });
});
