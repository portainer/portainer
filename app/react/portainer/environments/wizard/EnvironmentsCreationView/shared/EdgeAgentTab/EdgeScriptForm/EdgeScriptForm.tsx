import { Formik } from 'formik';

import { OsSelector } from '@/edge/components/EdgeScriptForm/OsSelector';
import { CommandTab } from '@/edge/components/EdgeScriptForm/scripts';
import { ScriptTabs } from '@/edge/components/EdgeScriptForm/ScriptTabs';
import { OS, Platform } from '@/edge/components/EdgeScriptForm/types';

import { EdgeInfo } from '../types';

import { EdgeScriptSettingsFieldset } from './EdgeScriptSettingsFieldset';
import { validationSchema } from './EdgeScriptForm.validation';
import { ScriptFormValues } from './types';

const edgePropertiesFormInitialValues: ScriptFormValues = {
  allowSelfSignedCertificates: false,
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
    <Formik
      initialValues={edgePropertiesFormInitialValues}
      validationSchema={() => validationSchema(isNomadTokenVisible)}
      onSubmit={() => {}}
    >
      {({ values, setFieldValue }) => (
        <>
          <EdgeScriptSettingsFieldset
            isNomadTokenVisible={isNomadTokenVisible}
          />

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
            onPlatformChange={(platform) => setFieldValue('platform', platform)}
          />
        </>
      )}
    </Formik>
  );
}
