import { helper } from './helper';

export const inheritedName = helper.accessor('Name', {
  cell({ row: { original: item }, getValue }) {
    const name = getValue();
    return (
      <>
        {name}
        {item.Inherited && (
          <span className="text-muted small">
            <code className="text-sm">inherited</code>
          </span>
        )}
        {item.Override && (
          <span className="text-muted small">
            <code className="text-sm">override</code>
          </span>
        )}
      </>
    );
  },
});
