import { fetchCharacterList } from "./assetApi.js";

export type CharacterSelectOptions = {
  emptyLabel?: string;
  loadingLabel?: string;
  preferredCharacterId?: string;
};

/**
 * Loads character ids and applies them to a select control.
 */
export async function populateCharacterSelect(
  select: HTMLSelectElement,
  options: CharacterSelectOptions = {},
) {
  const loadingLabel = options.loadingLabel ?? "캐릭터를 불러오는 중이에요.";
  const emptyLabel = options.emptyLabel ?? "아직 캐릭터가 없어요.";
  const preferredCharacterId = options.preferredCharacterId ?? "rine";

  select.replaceChildren(new Option(loadingLabel, ""));

  const characters = await fetchCharacterList();

  if (characters.length === 0) {
    select.replaceChildren(new Option(emptyLabel, ""));
    select.value = "";
    return "";
  }

  select.replaceChildren(...characters.map((characterId) => new Option(characterId, characterId)));
  select.value = characters.includes(preferredCharacterId) ? preferredCharacterId : characters[0] ?? "";

  return select.value;
}
