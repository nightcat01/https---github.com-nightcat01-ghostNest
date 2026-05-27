type CharacterNavItem = {
  id: string;
  href: string;
  label: string;
};

const navItems: CharacterNavItem[] = [
  { id: "home", href: "./dev-character.html", label: "제작 홈" },
  { id: "create", href: "./dev-character-create.html", label: "캐릭터 만들기" },
  { id: "expression", href: "./dev-character-expression.html", label: "표정 이미지" },
  { id: "set", href: "./dev-character-set.html", label: "캐릭터 상태" },
  { id: "layer", href: "./dev-assets-layer.html", label: "파츠 / 애니메이션" },
  { id: "scene", href: "./dev-character-scene.html", label: "배경 / 소품" },
  { id: "crop", href: "./dev-assets-crop.html", label: "Crop" },
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

    link.href = item.href;
    link.textContent = item.label;

    if (item.id === currentPageId) {
      link.setAttribute("aria-current", "page");
    }

    return link;
  }));
}

document.querySelectorAll<HTMLElement>("[data-character-nav]").forEach(renderCharacterNav);
