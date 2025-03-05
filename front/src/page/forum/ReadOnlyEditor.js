// import React, { useEffect } from "react";
// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Bold from "@tiptap/extension-bold";
// import Italic from "@tiptap/extension-italic";
// import Underline from "@tiptap/extension-underline";
// import Link from "@tiptap/extension-link";
// import Blockquote from "@tiptap/extension-blockquote";
// import styled from "styled-components";

// // 스타일 정의 (원본 링크 기능 제거)
// const ReadOnlyEditorContainer = styled.div`
//   .ProseMirror blockquote {
//     display: block;
//     width: 100%;
//     box-sizing: border-box;
//     border-left: 4px solid #c00;
//     background-color: #e9e9e9;
//     margin: 8px 0;
//     padding: 0.5rem 1rem;
//     color: #333;
//     border-radius: 4px;
//     font-size: 0.9rem;
//     position: relative;
//   }

//   .ProseMirror blockquote .reply-quote-header {
//     font-weight: bold;
//     color: #007bff;
//     margin-bottom: 0.2rem;
//   }

//   .ProseMirror blockquote .reply-quote-body {
//     font-style: italic;
//     color: #555;
//     margin-left: 0.5rem;
//     margin-bottom: 1rem;
//   }
// `;

// const ReadOnlyEditor = ({ contentJSON }) => {
//   const editor = useEditor({
//     extensions: [StarterKit, Bold, Italic, Underline, Link, Blockquote],
//     content: contentJSON,
//     editable: false, // 읽기 전용 모드
//   });

//   // contentJSON이 변경되면 에디터 콘텐츠 갱신
//   useEffect(() => {
//     if (editor) {
//       editor.commands.setContent(contentJSON);
//     }
//   }, [contentJSON, editor]);

//   return (
//     <ReadOnlyEditorContainer>
//       <EditorContent editor={editor} />
//     </ReadOnlyEditorContainer>
//   );
// };

// export default ReadOnlyEditor;
