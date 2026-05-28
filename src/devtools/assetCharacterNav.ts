type CharacterNavItem = {
  id: string;
  href: string;
  label: string;
  group: "flow" | "support";
  step?: string;
};

const navItems: CharacterNavItem[] = [
  { id: "home", href: "./dev-character.html", label: "제작 홈", group: "flow", step: "0" },
  { id: "create", href: "./dev-character-create.html", label: "캐릭터", group: "flow", step: "1" },
  { id: "expression", href: "./dev-character-expression.html", label: "표정", group: "flow", step: "2" },
  { id: "set", href: "./dev-character-set.html", label: "상태", group: "flow", step: "3" },
  { id: "layer", href: "./dev-assets-layer.html", label: "파츠", group: "flow", step: "4" },
  { id: "scene", href: "./dev-character-scene.html", label: "Scene", group: "flow", step: "5" },
  { id: "crop", href: "./dev-assets-crop.html", label: "Crop", group: "support" },
  { id: "composition", href: "./dev-character-composition.html", label: "Set 조합", group: "support" },
];

/**
 * Finds the current page id from the nav dataset or browser path.
 */
function getCurrentPageId(nav: HTMLElement) {
  const currentPage = nav.dataset.currentPage;

  if (currentPage) {
    return currentPage;
  }

  const currentFileName = window.location.pathname.split("/").pop() ?? "";
  const currentItem = navItems.find((item) => item.href.endsWith(currentFileName));

  return currentItem?.id ?? "home";
}

/**
 * Renders the shared character settings navigation.
 */
function renderCharacterNav(nav: HTMLElement) {
  const currentPageId = getCurrentPageId(nav);

  nav.replaceChildren(...navItems.map((item) => {
    const link = document.createElement("a");
    const label = document.createElement("span");

    link.href = item.href;
    link.dataset.navGroup = item.group;
    label.textContent = item.label;

    if (item.step) {
      const step = document.createElement("strong");

      step.textContent = item.step;
      link.append(step);
    }

    link.append(label);

    if (item.id === currentPageId) {
      link.setAttribute("aria-current", "page");
    }

    return link;
  }));
}

document.querySelectorAll<HTMLElement>("[data-character-nav]").forEach(renderCharacterNav);
