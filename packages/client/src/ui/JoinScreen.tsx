import { useState } from "react";
import type { FormEvent } from "react";
import type { GameClient } from "../session/index.js";
export interface JoinScreenProps {
  readonly client: GameClient;
  readonly canJoin: boolean;
}
const maxNameLength = 32;
export function JoinScreen({ client, canJoin }: JoinScreenProps) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (trimmed !== "" && canJoin) {
      client.join(trimmed);
    }
  };
  return (
    <form className="panel join" onSubmit={submit}>
      <h2>Join</h2>
      <label>
        Name{" "}
        <input value={name} maxLength={maxNameLength} onChange={(event) => setName(event.target.value)} autoFocus />
      </label>{" "}
      <button type="submit" disabled={trimmed === "" || !canJoin}>
        Join
      </button>
    </form>
  );
}
