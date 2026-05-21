const defaultDisplay = "balloon";
const panelDragMargin = 16;
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function getMenuElement(targets, display) {
    return display === "panel" ? targets.panel : targets.balloon;
}
function getOtherMenuElement(targets, display) {
    return display === "panel" ? targets.balloon : targets.panel;
}
function closeMenuElement(menuElement) {
    if (!menuElement) {
        return;
    }
    menuElement.hidden = true;
    menuElement.replaceChildren();
}
function makePanelMenuDraggable(menuElement, handleElement) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    handleElement.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) {
            return;
        }
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        const menuRect = menuElement.getBoundingClientRect();
        const parentRect = (menuElement.offsetParent ?? document.documentElement).getBoundingClientRect();
        initialX = menuRect.left - parentRect.left;
        initialY = menuRect.top - parentRect.top;
        menuElement.style.width = `${menuRect.width}px`;
        menuElement.style.height = `${menuRect.height}px`;
        menuElement.style.right = "auto";
        menuElement.style.bottom = "auto";
        menuElement.style.left = `${initialX}px`;
        menuElement.style.top = `${initialY}px`;
        menuElement.dataset.dragging = "true";
        handleElement.setPointerCapture?.(event.pointerId);
    });
    handleElement.addEventListener("pointermove", (event) => {
        if (!isDragging) {
            return;
        }
        event.preventDefault();
        const parentRect = (menuElement.offsetParent ?? document.documentElement).getBoundingClientRect();
        const minX = panelDragMargin;
        const minY = panelDragMargin;
        const maxX = Math.max(minX, parentRect.width - menuElement.offsetWidth - panelDragMargin);
        const maxY = Math.max(minY, parentRect.height - menuElement.offsetHeight - panelDragMargin);
        const nextX = clamp(initialX + event.clientX - startX, minX, maxX);
        const nextY = clamp(initialY + event.clientY - startY, minY, maxY);
        menuElement.style.left = `${nextX}px`;
        menuElement.style.top = `${nextY}px`;
    });
    const stopDragging = (event) => {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        delete menuElement.dataset.dragging;
        menuElement.style.removeProperty("height");
        handleElement.releasePointerCapture?.(event.pointerId);
    };
    handleElement.addEventListener("pointerup", stopDragging);
    handleElement.addEventListener("pointercancel", stopDragging);
}
function renderMenuContent({ action, targets, runActions, previewItem, currentItems = action.items, parentItems, menuTitle = action.title, display, menuElement, }) {
    const contentElement = display === "panel"
        ? document.createElement("div")
        : menuElement;
    if (menuTitle) {
        const titleElement = document.createElement("strong");
        titleElement.className = "management-menu-title";
        titleElement.textContent = menuTitle;
        if (display === "panel") {
            makePanelMenuDraggable(menuElement, titleElement);
        }
        menuElement.append(titleElement);
    }
    if (display === "panel") {
        contentElement.className = "management-menu-body";
        menuElement.append(contentElement);
    }
    if (parentItems) {
        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.textContent = "← 뒤로";
        backButton.dataset.managementAction = "back";
        backButton.addEventListener("click", () => {
            renderManagementMenu({
                action,
                targets,
                runActions,
                previewItem,
                currentItems: parentItems,
                menuTitle: action.title,
                display,
            });
        });
        contentElement.append(backButton);
    }
    currentItems.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item.label;
        button.dataset.managementAction = item.id;
        if (item.description) {
            button.title = item.description;
            button.addEventListener("pointerenter", () => previewItem?.(item));
            button.addEventListener("focus", () => previewItem?.(item));
        }
        button.addEventListener("click", () => {
            previewItem?.(item);
            if (item.children) {
                renderManagementMenu({
                    action,
                    targets,
                    runActions,
                    previewItem,
                    currentItems: item.children,
                    parentItems: currentItems,
                    menuTitle: item.label,
                    display,
                });
                return;
            }
            void runActions([...(item.actions ?? []), { type: "close_management_menu" }]);
        });
        contentElement.append(button);
    });
}
/**
 * Renders a management menu into the selected UI target.
 * The runtime owns action execution, while this renderer owns DOM shape and menu navigation.
 */
export function renderManagementMenu({ action, targets, runActions, previewItem, currentItems = action.items, parentItems, menuTitle = action.title, display, }) {
    const menuElement = getMenuElement(targets, display);
    if (!menuElement) {
        return;
    }
    closeMenuElement(getOtherMenuElement(targets, display));
    menuElement.replaceChildren();
    menuElement.dataset.managementMenuDisplay = display;
    renderMenuContent({
        action,
        targets,
        runActions,
        previewItem,
        currentItems,
        parentItems,
        menuTitle,
        display,
        menuElement,
    });
    menuElement.hidden = false;
}
/**
 * Clears all management menu targets.
 */
export function closeManagementMenu(targets) {
    closeMenuElement(targets.balloon);
    closeMenuElement(targets.panel);
}
/**
 * Resolves whether a menu should open in the balloon, panel, or a custom display slot.
 */
export function resolveManagementMenuDisplay(action, options) {
    if (action.menuId && options?.displays?.[action.menuId]) {
        return options.displays[action.menuId] ?? defaultDisplay;
    }
    return options?.defaultDisplay ?? defaultDisplay;
}
//# sourceMappingURL=managementMenu.js.map