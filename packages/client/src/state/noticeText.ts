import type { CommandRejectionReason, MatchEndedEvent, PlayerSnapshot } from "@node-stream/shared";
const rejectionTexts: Readonly<Record<CommandRejectionReason, string>> = {
  planetTaken: "That planet is already taken",
  alreadyClaimed: "You have already claimed a starting planet",
  notOwner: "You do not own the source planet",
  outOfRange: "The target is beyond maxHopDistance",
  linkExists: "That link already exists",
  linkMissing: "That link does not exist",
  invalidPlanet: "That planet does not exist",
};
export function rejectionText(reason: CommandRejectionReason): string {
  return rejectionTexts[reason];
}
export function winnerLine(result: MatchEndedEvent, players: readonly PlayerSnapshot[]): string {
  if (result.winnerId === null) {
    return `Draw (${result.reason})`;
  }
  const winner = players.find((player) => player.id === result.winnerId);
  return `Winner: ${winner?.name ?? `Player ${result.winnerId}`} (${result.reason})`;
}
