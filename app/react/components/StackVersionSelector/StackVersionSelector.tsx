interface Props {
  versions?: number[];
  onChange(value: number): void;
}

export function StackVersionSelector({ versions, onChange }: Props) {
  if (!versions || versions.length === 0) {
    return null;
  }

  const showSelector = versions.length > 1;

  const versionOptions = versions.map((version) => ({
    value: version,
    label: version.toString(),
  }));

  return (
    <div className="flex">
      {!showSelector && (
        <>
          <label className="text-muted mr-2" htmlFor="version_id">
            <span>Version:</span>
          </label>
          <span className="text-muted" id="version_id">
            {versions[0]}
          </span>
        </>
      )}

      {showSelector && (
        <div className="text-muted">
          <label className="mr-2" htmlFor="version_id">
            <span>Version:</span>
          </label>
          <select
            className="form-select"
            data-cy="version-selector"
            style={{
              width: '60px',
              height: '24px',
              borderRadius: '4px',
              borderColor: 'hsl(0, 0%, 80%)',
              padding: '2px 8px',
            }}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
          >
            {versionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
