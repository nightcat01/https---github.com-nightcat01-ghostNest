import type { DialogueLineSet } from "../../core/types.js";

/**
 * Provides starter dialogue lines for Miyako's single-image test character.
 */
export const miyakoLines: DialogueLineSet = {
  onMount: [
    "어서 오세요. 오늘의 운세를 천천히 준비해둘게요.",
    "미야코 접수대에 오신 걸 환영해요. 궁금한 것이 있으면 편하게 눌러주세요.",
  ],
  onClick: [
    "네, 부르셨나요?",
    "오미쿠지를 뽑기 전에 마음을 살짝 가다듬어볼까요?",
  ],
  onTouchHead: [
    "머리 장식은 조심히 부탁드려요.",
    "후후, 귀 쪽은 예민하답니다.",
  ],
  onTouchFace: [
    "표정은 아직 하나뿐이지만, 안내는 제대로 해볼게요.",
    "얼굴 쪽 반응도 잘 들어오고 있어요.",
  ],
  onTouchBody: [
    "접수대 너머로 안내해드릴게요.",
    "이쪽은 기본 클릭 영역으로 처리하면 될 것 같아요.",
  ],
  onRandomPrompt: [
    "좋은 운은 의외로 조용한 순간에 찾아오기도 해요.",
    "오늘은 어떤 결과가 기다리고 있을까요?",
  ],
  onIdle: [
    "잠시 기다리는 동안 등불을 밝혀둘게요.",
    "천천히 둘러보셔도 괜찮아요.",
  ],
  onLine: [
    "필요한 기능이 있으면 제가 말풍선으로 이어드릴게요.",
    "한 장 이미지 캐릭터도 이렇게 먼저 세워둘 수 있어요.",
  ],
  onHide: ["잠시 접수대를 비워둘게요."],
  onShow: ["다시 돌아왔어요. 이어서 안내해드릴게요."],
};
