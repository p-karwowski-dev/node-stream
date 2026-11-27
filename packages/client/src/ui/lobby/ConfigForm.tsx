import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ConfigError, MatchConfig, MatchConfigParameter } from "@node-stream/shared";
import type { GameClient } from "../../session/index.js";
import { configParameters, formatConfigValue, parseConfigDrafts } from "../../state/index.js";
import type { ConfigDrafts } from "../../state/index.js";
export interface ConfigFormProps {
  readonly client: GameClient;
  readonly config: MatchConfig;
  readonly configErrors: readonly ConfigError[];
  readonly editable: boolean;
}
export function ConfigForm({ client, config, configErrors, editable }: ConfigFormProps) {
  const [drafts, setDrafts] = useState<ConfigDrafts>({});
  useEffect(() => setDrafts({}), [config]);
  const errorFor = (parameter: MatchConfigParameter) =>
    configErrors
      .filter((error) => error.parameter === parameter)
      .map((error) => error.message)
      .join("; ");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseConfigDrafts(config, drafts);
    if (!parsed.ok) {
      client.showNotice(parsed.errors.map((error) => `${error.parameter}: ${error.message}`).join("; "));
      return;
    }
    if (Object.keys(parsed.changes).length > 0) {
      client.setConfig(parsed.changes);
    }
  };
  return (
    <form className="config" onSubmit={submit}>
      <table>
        <tbody>
          {configParameters(config).map((parameter) => (
            <tr key={parameter}>
              <td>
                <label htmlFor={`config-${parameter}`}>{parameter}</label>
              </td>
              <td>
                <input
                  id={`config-${parameter}`}
                  name={parameter}
                  value={drafts[parameter] ?? formatConfigValue(config[parameter])}
                  disabled={!editable}
                  onChange={(event) => setDrafts({ ...drafts, [parameter]: event.target.value })}
                />
              </td>
              <td className="error">{errorFor(parameter)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {editable ? <button type="submit">Apply</button> : null}
    </form>
  );
}
