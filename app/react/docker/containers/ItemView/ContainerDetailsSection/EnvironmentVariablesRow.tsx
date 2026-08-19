import { DetailsTable } from '@@/DetailsTable';

interface EnvironmentVariablesRowProps {
  variables: Array<string> | undefined;
}

export function EnvironmentVariablesRow({
  variables,
}: EnvironmentVariablesRowProps) {
  if (!variables || variables?.length === 0) {
    return null;
  }

  const sortedEnv = [...variables].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return (
    <DetailsTable.Row label="ENV">
      <table className="table-bordered table-condensed !m-0 table">
        <tbody>
          {sortedEnv.map((envVar, index) => {
            const { key, value } = parseEnvVariable(envVar);
            return (
              <tr key={index}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DetailsTable.Row>
  );
}

function parseEnvVariable(envVar: string): { key: string; value: string } {
  const index = envVar.indexOf('=');
  if (index === -1) {
    return { key: envVar, value: '' };
  }
  return {
    key: envVar.substring(0, index),
    value: envVar.substring(index + 1),
  };
}
