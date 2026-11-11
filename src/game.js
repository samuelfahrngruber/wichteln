export function draw(names, exclusions, seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const choices = names.map((_, giver) => {
    const recipients = names
      .map((_, index) => index)
      .filter(
        (recipient) =>
          recipient !== giver &&
          !exclusions.some(([from, to]) => from === giver && to === recipient),
      );
    for (let i = recipients.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
    return recipients;
  });
  const owners = Array(names.length).fill(-1);
  function match(giver, seen) {
    for (const recipient of choices[giver]) {
      if (seen.has(recipient)) continue;
      seen.add(recipient);
      if (owners[recipient] === -1 || match(owners[recipient], seen)) {
        owners[recipient] = giver;
        return true;
      }
    }
    return false;
  }
  for (let giver = 0; giver < names.length; giver++) {
    if (!match(giver, new Set())) throw new Error("impossible");
  }
  const assignments = Array(names.length);
  owners.forEach((giver, recipient) => {
    assignments[giver] = recipient;
  });
  return assignments;
}

export function validateGame(game) {
  const invalid = () => {
    throw new Error("invalid");
  };
  if (!game || game.version !== 1) invalid();
  if (
    game.groupName !== undefined &&
    (typeof game.groupName !== "string" || !game.groupName.trim())
  )
    invalid();
  const { names, exclusions, seed, assignments } = game;
  if (
    !Array.isArray(names) ||
    names.length < 2 ||
    names.some((name) => typeof name !== "string" || !name.trim()) ||
    new Set(names).size !== names.length
  )
    invalid();
  const isIndex = (index) => Number.isInteger(index) && index >= 0 && index < names.length;
  if (
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    !Array.isArray(exclusions) ||
    exclusions.some(
      (pair) =>
        !Array.isArray(pair) || pair.length !== 2 || !pair.every(isIndex) || pair[0] === pair[1],
    )
  )
    invalid();
  if (
    !Array.isArray(assignments) ||
    assignments.length !== names.length ||
    new Set(assignments).size !== names.length ||
    assignments.some(
      (recipient, giver) =>
        !isIndex(recipient) ||
        recipient === giver ||
        exclusions.some(([from, to]) => from === giver && to === recipient),
    )
  )
    invalid();
  return game;
}

export function encodeGame(game) {
  validateGame(game);
  const bytes = new TextEncoder().encode(JSON.stringify(game));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function decodeGame(value) {
  try {
    const bytes = Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) =>
      char.charCodeAt(0),
    );
    return validateGame(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch {
    throw new Error("invalid");
  }
}
