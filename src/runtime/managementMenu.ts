import type { RuntimeAction } from "../core/types.js";

type OpenManagementMenuAction = Extract<RuntimeAction, { type: "open_management_menu" }>;
type RunActions = (actions: RuntimeAction[]) => void | Promise<void>;

type RenderManagementMenuOptions = {
  action: OpenManagementMenuAction;
  menuElement: HTMLElement | null;
  runActions: RunActions;
  currentItems?: OpenManagementMenuAction["items"];
  parentItems?: OpenManagementMenuAction["items"];
  menuTitle?: string | undefined;
};

/**
 * 말풍선 내부에 관리 메뉴 버튼을 렌더링합니다.
 */
export function renderManagementMenu({
  action,
  menuElement,
  runActions,
  currentItems = action.items,
  parentItems,
  menuTitle = action.title,
}: RenderManagementMenuOptions) {
  if (!menuElement) {
    return;
  }

  menuElement.replaceChildren();

  if (menuTitle) {
    const titleElement = document.createElement("strong");
    titleElement.textContent = menuTitle;
    menuElement.append(titleElement);
  }

  if (parentItems) {
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.textContent = "← 뒤로";
    backButton.dataset.managementAction = "back";
    backButton.addEventListener("click", () => {
      renderManagementMenu({
        action,
        menuElement,
        runActions,
        currentItems: parentItems,
        menuTitle: action.title,
      });
    });
    menuElement.append(backButton);
  }

  currentItems.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.dataset.managementAction = item.id;
    button.addEventListener("click", () => {
      if (item.children) {
        renderManagementMenu({
          action,
          menuElement,
          runActions,
          currentItems: item.children,
          parentItems: currentItems,
          menuTitle: item.label,
        });
        return;
      }

      void runActions([...(item.actions ?? []), { type: "close_management_menu" }]);
    });
    menuElement.append(button);
  });

  menuElement.hidden = false;
}

export function closeManagementMenu(menuElement: HTMLElement | null) {
  if (!menuElement) {
    return;
  }

  menuElement.hidden = true;
  menuElement.replaceChildren();
}
