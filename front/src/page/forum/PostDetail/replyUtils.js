// replyUtil.js
// -------------------------
// 이 파일은 포럼(PostDetail) 내에서 게시글이나 댓글의 내용을 인용(답글)할 때
// blockquote 형태의 TipTap JSON 객체를 생성하는 유틸 함수입니다.
// -------------------------

/**
 * 인용(답글)용 blockquote JSON 객체를 생성하는 함수
 * @param {object} target - 인용 대상 객체 (게시글 또는 댓글)
 * @returns {object} - blockquote 형태의 JSON 객체
 */
export const createReplyBlock = (target) => {
  // target의 contentJSON이 있으면 파싱, 없으면 HTML을 JSON으로 변환
  let parsedJson;
  try {
    if (target.contentJSON) {
      parsedJson =
        typeof target.contentJSON === "string"
          ? JSON.parse(target.contentJSON)
          : target.contentJSON;
    } else {
      // content가 없으면 빈 텍스트로 처리
      parsedJson = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
      };
    }
  } catch (error) {
    // 파싱 오류 시 HTML을 간단히 텍스트로 변환 후 JSON 객체 생성
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = target.content || "";
    const text = tempDiv.textContent || tempDiv.innerText || "";
    parsedJson = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    };
  }

  // 인용할 본문 내용 추출 (parsedJson.content)
  const rawBody = (parsedJson && parsedJson.content) || [];

  // 인용 헤더: 인용 대상 작성자 정보 표시
  const headerParagraph = {
    type: "paragraph",
    attrs: { class: "reply-quote-header" },
    content: [
      { type: "text", text: `${target.authorName}님이 말씀하셨습니다:` },
    ],
  };

  // 인용 본문: 내용이 없으면 기본 메시지 사용
  const bodyParagraph = {
    type: "paragraph",
    content:
      rawBody.length > 0
        ? rawBody
        : [{ type: "text", text: "(내용이 없습니다.)" }],
  };

  // blockquote 객체 생성
  const quotedContent = {
    type: "blockquote",
    attrs: { class: "reply-quote" },
    content: [headerParagraph, bodyParagraph],
  };

  return quotedContent;
};
