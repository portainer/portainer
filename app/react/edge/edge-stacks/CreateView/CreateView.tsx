import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { CreateForm } from './CreateForm';

export function CreateView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('edge.stacks.create.title')}
        breadcrumbs={[
          { label: t('edge.stacks.create.breadcrumbs_label'), link: 'edge.stacks' },
          t('edge.stacks.create.breadcrumbs_create'),
        ]}
        reload
      />

      <CreateForm />
    </>
  );
}
