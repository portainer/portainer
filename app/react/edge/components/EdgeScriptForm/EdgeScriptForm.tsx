import { Formik } from 'formik';

import { OsSelector } from './OsSelector';
import { CommandTab } from './scripts';
import { ScriptTabs } from './ScriptTabs';
import { EdgeScriptSettingsFieldset } from './EdgeScriptSettingsFieldset';
import { validationSchema } from './EdgeScriptForm.validation';
import { ScriptFormValues, OS, Platform, EdgeInfo } from './types';

const edgePropertiesFormInitialValues: ScriptFormValues = {
  allowSelfSignedCertificates: true,
  envVars: '',
  os: 'linux' as OS,
  platform: 'k8s' as Platform,
  nomadToken: '',
  authEnabled: true,
};

interface Props {
  edgeInfo: EdgeInfo;
  commands: CommandTab[] | Partial<Record<OS, CommandTab[]>>;
  isNomadTokenVisible?: boolean;
}

export function EdgeScriptForm({
  edgeInfo,
  commands,
  isNomadTokenVisible,
}: Props) {
  const showOsSelector = !(commands instanceof Array);

  return (
    <div className="form-horizontal">
      <Formik
        initialValues={edgePropertiesFormInitialValues}
        validationSchema={() => validationSchema(isNomadTokenVisible)}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue }) => (
          <>
            <EdgeScriptSettingsFieldset
              isNomadTokenVisible={
                isNomadTokenVisible && values.platform === 'nomad'
              }
              hideIdGetter={edgeInfo.id !== undefined}
            />
            <div className="mt-8">
              {showOsSelector && (
                <OsSelector
                  value={values.os}
                  onChange={(value) => setFieldValue('os', value)}
                />
              )}
              <ScriptTabs
                edgeId={edgeInfo.id}
                edgeKey={edgeInfo.key}
                values={values}
                commands={showOsSelector ? commands[values.os] || [] : commands}
                platform={values.platform}
                onPlatformChange={(platform) =>
                  setFieldValue('platform', platform)
                }
              />
            </div>
          </>
        )}
      </Formik>
    </div>
  );
}
