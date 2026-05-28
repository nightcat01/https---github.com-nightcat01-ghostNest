import type {
  RuntimeAction,
  RuntimeCondition,
  RuntimeEventName,
  RuntimeRule,
  RuntimeRuleWhen,
} from "../../core/types.js";

export type NanikaMapping = {
  id: string;
  name?: string;
  description?: string;
  event: RuntimeEventName;
  when?: RuntimeRuleWhen;
  conditions?: RuntimeCondition[];
  actions: RuntimeAction[];
};

/**
 * Converts an editor-facing mapping into the runtime rule format.
 */
export function createRuntimeRuleFromMapping(mapping: NanikaMapping): RuntimeRule {
  const rule: RuntimeRule = {
    id: mapping.id,
    event: mapping.event,
    actions: mapping.actions,
  };

  if (mapping.when) {
    rule.when = mapping.when;
  }

  if (mapping.conditions) {
    rule.conditions = mapping.conditions;
  }

  return rule;
}

/**
 * Converts editor-facing mappings into runtime rules.
 */
export function createRuntimeRulesFromMappings(mappings: readonly NanikaMapping[] = []): RuntimeRule[] {
  return mappings.map(createRuntimeRuleFromMapping);
}
