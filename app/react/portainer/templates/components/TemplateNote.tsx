import sanitize from 'sanitize-html';

import { FormSection } from '@@/form-components/FormSection';

export function TemplateNote({ note }: { note?: string }) {
  if (!note) {
    return null;
  }

  return (
    <FormSection title="Information">
      <div className="form-group">
        <div className="col-sm-12">
          <div
            className="text-xs"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: sanitize(note),
            }}
          />
        </div>
      </div>
    </FormSection>
  );
}
