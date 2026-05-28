import {
  createNanikaMappingRegistry,
} from "../plugins/nanikaMapping/index.js";
import { nanikaPreset } from "../ghost/preset.js";
import { requireElement } from "./assetShared.js";
import type { RuntimeAction, RuntimeControlOptions, RuntimeRule } from "../core/types.js";

const registry = createNanikaMappingRegistry(nanikaPreset);

const summary = requireElement(document.querySelector<HTMLElement>("#mappingSummary"), "#mappingSummary");
const characterList = requireElement(document.querySelector<HTMLElement>("#characterList"), "#characterList");
const capabilityList = requireElement(document.querySelector<HTMLElement>("#capabilityList"), "#capabilityList");
const eventList = requireElement(document.querySelector<HTMLElement>("#eventList"), "#eventList");
const actionList = requireElement(document.querySelector<HTMLElement>("#actionList"), "#actionList");
const mappingList = requireElement(document.querySelector<HTMLElement>("#mappingList"), "#mappingList");

/**
 * Creates a compact mapping card for catalog and preset records.
 */
function createCard(title: string, description: string, meta: string[] = []) {
  const card = document.createElement("article");
  card.className = "nanika-mapping-card";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const body = document.createElement("p");
  body.textContent = description;

  card.append(heading, body);

  if (meta.length > 0) {
    const metaList = document.createElement("div");
    metaList.className = "nanika-mapping-meta";

    meta.forEach((item) => {
      const pill = document.createElement("span");
      pill.textContent = item;
      metaList.append(pill);
    });

    card.append(metaList);
  }

  return card;
}

/**
 * Formats an action into a short readable label.
 */
function formatAction(action: RuntimeAction) {
  const record = action as Record<string, unknown>;

  if (action.type === "call_plugin") {
    return `${action.type}:${String(record.pluginId ?? "")}`;
  }

  if (action.type === "speak") {
    return `${action.type}:${String(record.category ?? "")}`;
  }

  if (action.type === "speak_text") {
    return `${action.type}`;
  }

  if (action.type === "surface") {
    return `${action.type}:${String(record.id ?? "")}`;
  }

  return action.type;
}

/**
 * Formats required control keys from optional catalog metadata.
 */
function formatRequiredControls(item: unknown) {
  const controls = (item as { requiredControls?: readonly (keyof RuntimeControlOptions)[] }).requiredControls ?? [];

  return controls.map((control) => `control: ${String(control)}`);
}

/**
 * Renders the current preset summary.
 */
function renderSummary() {
  const rules = registry.mappings;
  const capabilities = registry.capabilities;

  summary.replaceChildren(
    createCard("Preset", registry.preset.name, [
      `id: ${registry.preset.id}`,
      `rules: ${rules.length}`,
      `plugins: ${registry.plugins.length}`,
      `capabilities: ${capabilities.length}`,
    ]),
    createCard("Character", registry.character.name, [
      `id: ${registry.character.id}`,
      `default: ${registry.character.defaultExpression}`,
    ]),
  );
}

/**
 * Renders character asset summary.
 */
function renderCharacter() {
  const { character } = registry;

  characterList.replaceChildren(
    createCard(character.name, character.description, [
      `expressions: ${character.expressionCount}`,
      `surfaces: ${character.surfaceCount}`,
      `scenes: ${character.sceneCount}`,
      `hitAreas: ${character.hitAreaCount}`,
    ]),
  );
}

/**
 * Renders plugin capabilities.
 */
function renderCapabilities() {
  const { capabilities } = registry;

  if (capabilities.length === 0) {
    capabilityList.replaceChildren(createCard("연결된 기능 없음", "현재 preset에서 확인할 수 있는 plugin capability가 없어요."));
    return;
  }

  capabilityList.replaceChildren(...capabilities.map((capability) => createCard(
    capability.name,
    capability.description ?? "설명이 없는 기능입니다.",
    [`id: ${capability.id}`, capability.action.type],
  )));
}

/**
 * Renders runtime event catalog.
 */
function renderEvents() {
  eventList.replaceChildren(...registry.events.map((event) => createCard(
    event.label,
    event.description,
    [
      event.event,
      ...formatRequiredControls(event),
    ],
  )));
}

/**
 * Renders runtime action catalog.
 */
function renderActions() {
  actionList.replaceChildren(...registry.actions.map((action) => createCard(
    action.label,
    action.description,
    [
      action.type,
      `category: ${action.category}`,
      ...formatRequiredControls(action),
    ],
  )));
}

/**
 * Renders runtime rules as mapping preview cards.
 */
function renderMappings() {
  const rules: RuntimeRule[] = registry.mappings;

  if (rules.length === 0) {
    mappingList.replaceChildren(createCard("매핑 없음", "현재 preset에 등록된 rule이 없어요."));
    return;
  }

  mappingList.replaceChildren(...rules.map((rule) => createCard(
    rule.id,
    `${rule.event} 이벤트에서 ${rule.actions.length}개 액션을 실행합니다.`,
    [
      `event: ${rule.event}`,
      ...rule.actions.map(formatAction),
    ],
  )));
}

renderSummary();
renderCharacter();
renderCapabilities();
renderEvents();
renderActions();
renderMappings();
