import { createDemoManagementMenuItems } from "../demo/demoManagementMenu.js";
import { createDemoRules } from "../demo/demoRules.js";
import { character } from "./character.js";

/**
 * Defines the menu tree opened by the character management action.
 * Replace or extend this preset when mapping service-specific features.
 */
export const managementMenuItems = createDemoManagementMenuItems(character, {
  includeDeveloperTools: true,
});

/**
 * Maps runtime events to character behavior.
 * Keep this file focused on "when this happens, run these actions" rather than API or DB logic.
 */
export const nanikaRules = createDemoRules(managementMenuItems);
