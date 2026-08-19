import { Formik } from 'formik';
import { PropsWithChildren } from 'react';

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
  authEnabled: true,
  tlsEnabled: false,
  edgeGroupsIds: [],
  group: 0,
  tagsIds: [],
  edgeIdGenerator: '',
};

interface Props {
  edgeInfo: EdgeInfo;
  commands: CommandTab[] | Partial<Record<OS, CommandTab[]>>;
  asyncMode?: boolean;
  showMetaFields?: boolean;
}

export function EdgeScriptForm({
  edgeInfo,
  commands,
  asyncMode,
  showMetaFields,
  children,
}: PropsWithChildren<Props>) {
  const showOsSelector = !(commands instanceof Array);

  return (
    <div className="form-horizontal">
      <Formik
        initialValues={edgePropertiesFormInitialValues}
        validationSchema={() => validationSchema()}
        onSubmit={() => {}}
        validateOnMount
      >
        {({ values, setFieldValue }) => (
          <>
            {children}

            <EdgeScriptSettingsFieldset
              hideIdGetter={edgeInfo.id !== undefined}
              showMetaFields={showMetaFields}
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
                asyncMode={asyncMode}
              />
            </div>
          </>
        )}
      </Formik>
    </div>
  );
}
