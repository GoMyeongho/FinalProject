// // CommentInput.jsx
// import React from "react";
// import { CommentInputSection } from "../../../styles/PostDetailStyles";
// import { EditorContent } from "@tiptap/react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBold,
//   faItalic,
//   faUnderline,
//   faLink,
//   faTrashAlt,
//   faReply,
// } from "@fortawesome/free-solid-svg-icons";

// // 댓글 입력 컴포넌트
// // 이 컴포넌트는 댓글 작성을 위한 에디터 툴바와 입력 영역, 댓글 추가 버튼 등을 포함합니다.
// const CommentInput = ({
//   editor,
//   replyingTo,
//   onAddLink,
//   onAddComment,
//   onCancelReply,
// }) => {
//   return (
//     <CommentInputSection>
//       <div className="toolbar">
//         <button
//           onClick={() => editor.chain().focus().toggleBold().run()}
//           className={editor.isActive("bold") ? "active" : ""}
//         >
//           <strong>B</strong>
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleItalic().run()}
//           className={editor.isActive("italic") ? "active" : ""}
//         >
//           <em>I</em>
//         </button>
//         <button
//           onClick={() => editor.chain().focus().toggleUnderline().run()}
//           className={editor.isActive("underline") ? "active" : ""}
//         >
//           <u>U</u>
//         </button>
//         <button onClick={onAddLink}>Link</button>
//         <button
//           onClick={() => editor.chain().focus().unsetLink().run()}
//           disabled={!editor.isActive("link")}
//         >
//           Remove Link
//         </button>
//       </div>
//       {replyingTo && (
//         <div style={{ marginBottom: "5px" }}>
//           <em>인용 중...</em>{" "}
//           <button onClick={onCancelReply} style={{ fontSize: "0.8rem" }}>
//             [취소]
//           </button>
//         </div>
//       )}
//       <EditorContent editor={editor} className="editor" />
//       <button onClick={onAddComment}>댓글 추가</button>
//     </CommentInputSection>
//   );
// };

// export default CommentInput;
