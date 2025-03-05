import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { ToastContainer, toast } from "react-toastify";

// Styles for the modal
const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
`;
const Toolbar = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  gap: 5px;
  button {
    padding: 5px 10px;
    font-size: 14px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    &:hover {
      background: #f0f0f0;
    }
  }
`;
const LinkInputWrapper = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 10px;
  input {
    flex: 1;
    padding: 5px;
    font-size: 14px;
    border: 1px solid #ddd;
  }
  button {
    padding: 5px 10px;
    font-size: 14px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    &:hover {
      background-color: #0056b3;
    }
  }
`;
const ModalActions = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  button {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    &:nth-child(1) {
      background-color: #007bff;
      color: white;
      &:hover {
        background-color: #0056b3;
      }
    }
    &:nth-child(2) {
      background-color: #d9534f;
      color: white;
      &:hover {
        background-color: #c9302c;
      }
    }
  }
`;

// If you need a fallback HTML->JSON converter
const stripHTML = (html) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
};
const convertHtmlToJson = (html) => {
  const plainText = stripHTML(html);
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: plainText }],
      },
    ],
  };
};

/**
 * ConfirmationModal:
 *   - Handles various actions:
 *     - editPostTitle (simple <input>)
 *     - editPostContent / editComment (TipTap editor)
 *     - reportPost / reportComment (textarea)
 *     - deletePost / deleteComment (confirm only)
 *     - addLink (simple link input)
 */
const ConfirmationModal = ({
  isOpen,
  type,
  content,
  message,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Tiptap editor for content edits
  const editor = useEditor({
    extensions: [StarterKit, Bold, Italic, Underline, Link],
    content: "",
    onUpdate: ({ editor }) => {
      if (type === "editPostContent" || type === "editComment") {
        // store as JSON string
        setInputValue(JSON.stringify(editor.getJSON()));
      } else {
        // or store as HTML if you prefer
        setInputValue(editor.getHTML());
      }
    },
  });

  // When the modal opens, set up initial content
  useEffect(() => {
    if (!isOpen) return;
    setIsAddingLink(false);
    setLinkInput("");

    if (type === "editPostTitle") {
      // just a text input
      setInputValue(content || "");
      editor?.commands.clearContent();
    } else if (type === "editPostContent" || type === "editComment") {
      // parse content as JSON
      try {
        const parsed =
          typeof content === "string" ? JSON.parse(content) : content;
        editor?.commands.setContent(parsed);
        setInputValue(JSON.stringify(editor.getJSON()));
      } catch (err) {
        console.error("에디터 컨텐츠 설정 실패:", err);
        editor?.commands.setContent(convertHtmlToJson(content || ""));
        setInputValue(JSON.stringify(editor.getJSON()));
      }
    } else if (type === "reportComment" || type === "reportPost") {
      // simple text area
      editor?.commands.clearContent();
      setInputValue("");
    } else if (type === "addLink") {
      // separate link input
      editor?.commands.clearContent();
      setInputValue("");
    } else {
      // e.g. deletePost / deleteComment => no input needed
      editor?.commands.clearContent();
      setInputValue("");
    }
  }, [isOpen, type, content, editor]);

  const messages = {
    editPostTitle: "게시글 제목 수정:",
    editPostContent: "게시글 내용 수정:",
    editComment: "댓글 수정:",
    reportComment: "신고 사유를 입력해주세요:",
    reportPost: "신고 사유를 입력해주세요:",
    deletePost: "게시글을 삭제하시겠습니까?",
    deleteComment: "댓글을 삭제하시겠습니까?",
    addLink: "링크를 입력하세요:",
  };
  const dynamicMessage = messages[type] || message || "진행 하시겠습니까?";

  if (!isOpen) return null;

  return (
    <ModalWrapper>
      <ModalContent>
        <h3>{dynamicMessage}</h3>

        {/* (A) editPostTitle => simple text input */}
        {type === "editPostTitle" && (
          <div style={{ marginTop: "10px" }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
        )}

        {/* (B) reportComment / reportPost => textarea */}
        {(type === "reportComment" || type === "reportPost") && (
          <div style={{ marginTop: "10px" }}>
            <textarea
              value={inputValue}
              placeholder="신고 사유를 입력해주세요."
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: "100%", height: "80px", padding: "5px" }}
            />
          </div>
        )}

        {/* (C) addLink => single input */}
        {type === "addLink" && (
          <input
            type="text"
            value={linkInput}
            placeholder="https://example.com"
            onChange={(e) => setLinkInput(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "10px" }}
          />
        )}

        {/* (D) editPostContent / editComment => TipTap editor */}
        {(type === "editPostContent" || type === "editComment") && (
          <>
            <Toolbar>
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                B
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                I
              </button>
              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                U
              </button>
              <button onClick={() => setIsAddingLink(!isAddingLink)}>
                Link
              </button>
              <button onClick={() => editor?.chain().focus().unsetLink().run()}>
                Unlink
              </button>
            </Toolbar>
            <EditorContent editor={editor} />
          </>
        )}

        {/* (D-1) link insertion UI (within TipTap) */}
        {isAddingLink && (
          <LinkInputWrapper>
            <input
              type="text"
              value={linkInput}
              placeholder="https://example.com"
              onChange={(e) => setLinkInput(e.target.value)}
            />
            <button
              onClick={() => {
                if (!linkInput.trim()) {
                  return toast.warning("URL을 입력해주세요.");
                }
                let formattedUrl = linkInput;
                if (!/^https?:\/\//i.test(formattedUrl)) {
                  formattedUrl = "https://" + formattedUrl;
                }
                editor
                  ?.chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: formattedUrl })
                  .run();
                toast.success("링크가 추가되었습니다.");
                setIsAddingLink(false);
                setLinkInput("");
              }}
            >
              확인
            </button>
          </LinkInputWrapper>
        )}

        <ModalActions>
          <button
            onClick={() => {
              if (type === "addLink") {
                // "addLink" => pass final URL
                if (!linkInput.trim())
                  return toast.warning("URL을 입력해주세요.");
                let finalUrl = linkInput.trim();
                if (!/^https?:\/\//i.test(finalUrl)) {
                  finalUrl = "https://" + finalUrl;
                }
                onConfirm(finalUrl);
              } else if (type === "editPostContent" || type === "editComment") {
                // pass JSON from editor
                onConfirm(inputValue);
              } else if (type === "editPostTitle") {
                onConfirm(inputValue.trim());
              } else {
                // e.g. reportPost, reportComment, deletePost, deleteComment => pass inputValue
                onConfirm(inputValue.trim());
              }
            }}
          >
            Confirm
          </button>
          <button onClick={onCancel}>Cancel</button>
        </ModalActions>
      </ModalContent>
    </ModalWrapper>
  );
};

export default ConfirmationModal;
