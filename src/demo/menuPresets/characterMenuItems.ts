import type { CharacterDefinition, CharacterSurface, ManagementMenuItem } from "../../core/types.js";

function hasMouthLayer(surface: CharacterSurface) {
  return Boolean(surface.layers?.mouth || surface.mouthImages);
}

function createMouthAnimationMenuItem(character: CharacterDefinition | undefined): ManagementMenuItem {
  const surfaces = Object.values(character?.assets?.surfaces ?? {}).filter(hasMouthLayer);

  if (surfaces.length === 0) {
    return {
      id: "layer-animation-test",
      label: "입모양 테스트",
      description: "현재 캐릭터에 mouth 레이어가 있는 surface가 있는지 확인해요.",
      actions: [
        { type: "speak_text", text: "이 캐릭터에는 아직 테스트할 mouth 레이어가 없어요." },
        { type: "log", label: "management.layer_animation.mouth.empty" },
      ],
    };
  }

  return {
    id: "layer-animation-test",
    label: "입모양 테스트",
    description: "캐릭터 surface 중 mouth 레이어가 있는 항목을 골라 테스트해요.",
    children: surfaces.map((surface) => ({
      id: `layer-animation-test-mouth-${surface.id}`,
      label: `${surface.expression ?? "surface"} ${surface.id}`,
      description: surface.alt ?? `${character?.profile.name ?? "캐릭터"} surface ${surface.id}의 mouth 레이어를 테스트해요.`,
      actions: [
        {
          type: "speak_script",
          text: "입모양 레이어를 테스트해볼게요.",
          script: [
            { type: "surface", id: surface.id },
            { type: "text", value: "입모양 레이어를 테스트해볼게요." },
            { type: "wait", ms: 300 },
            { type: "newline" },
            { type: "text", value: "이 surface에 연결된 mouth 프레임으로 말하는 중이에요." },
            { type: "end" },
          ],
        },
        { type: "log", label: `management.layer_animation.mouth.${surface.id}` },
      ],
    })),
  };
}

/**
 * Creates demo menu items for character motion, visibility, and developer tools.
 */
export function createCharacterMenuItems(character?: CharacterDefinition): ManagementMenuItem[] {
  return [
    {
      id: "jump",
      label: "점프",
      description: "캐릭터 sprite 애니메이션을 실행해요.",
      actions: [
        { type: "play_animation", animation: "jump", duration: 460 },
        { type: "speak_text", text: "자, 가볍게 뛰어볼게요!" },
        { type: "log", label: "management.animation.jump" },
      ],
    },
    createMouthAnimationMenuItem(character),
    {
      id: "hide",
      label: "숨기기",
      description: "캐릭터를 잠시 숨기고, 배지로 다시 부를 수 있어요.",
      actions: [
        { type: "toggle_hidden" },
        { type: "speak", category: "onHide" },
        { type: "log", label: "management.hide" },
      ],
    },
    {
      id: "close",
      label: "나가기",
      description: "열려 있는 메뉴를 닫아요.",
      actions: [
        { type: "close_management_menu" },
        { type: "change_expression", expression: "neutral" },
        { type: "speak_text", text: "메뉴를 닫을게요." },
        { type: "log", label: "management.close" },
      ],
    },
  ];
}
