import sanitize from 'sanitize-html';

export function TemplateNote({ note }: { note: string | undefined }) {
  if (!note) {
    return null;
  }
  return (
    <div>
      <div className="col-sm-12 form-section-title"> Information </div>
      <div className="form-group">
        <div className="col-sm-12">
          <div
            className="template-note"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: sanitize(note),
            }}
          />
        </div>
      </div>
    </div>
  );
}
