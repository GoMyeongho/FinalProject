// CommentsContainer.jsx
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ForumApi from "../../../api/ForumApi";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Blockquote from "@tiptap/extension-blockquote";
// replyUtil.js에서 인용 블록 생성 함수 임포트
import { createReplyBlock } from "./replyUtils";

/**
 * HTML -> JSON 변환 함수 (기존 로직)
 */
const convertHtmlToJson = (html) => ({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: html || "" }] },
  ],
});

/**
 * 댓글 관련 로직 컨테이너
 * - 댓글 목록 조회, 추가, 삭제, 인용(답글), 좋아요 등의 기능을 담당합니다.
 * - postToReply와 setPostToReply prop을 통해 게시글 인용 요청을 처리합니다.
 */
const CommentsContainer = ({ postId, user, postToReply, setPostToReply }) => {
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 댓글 작성용 TipTap 에디터 인스턴스 생성
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Blockquote,
    ],
    content: "",
  });

  // 댓글 목록 불러오기
  const fetchComments = async () => {
    try {
      const data = await ForumApi.getCommentsByPostId(postId);
      const sorted = data.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      // contentJSON이 없거나 잘못된 경우 HTML을 JSON으로 변환
      sorted.forEach((comment) => {
        if (comment.contentJSON) {
          try {
            if (typeof comment.contentJSON === "string") {
              comment.contentJSON = JSON.parse(comment.contentJSON);
            }
          } catch {
            comment.contentJSON = convertHtmlToJson(comment.content);
          }
        } else if (comment.content) {
          comment.contentJSON = convertHtmlToJson(comment.content);
        }
      });
      setComments(sorted);
    } catch (error) {
      console.error("댓글 로딩 중 오류:", error);
      toast.error("댓글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // 댓글 추가 함수
  const handleAddComment = async () => {
    if (!editor) return;
    const jsonData = editor.getJSON();
    const htmlData = editor.getHTML();

    if (!jsonData || !jsonData.content || jsonData.content.length === 0) {
      toast.warning("댓글이 비어있거나 잘못된 형식입니다.");
      return;
    }

    try {
      await ForumApi.addComment({
        postId,
        memberId: user.id,
        content: htmlData,
        contentJSON: JSON.stringify(jsonData),
        parentCommentId: replyingTo?.parentCommentId || null,
        opAuthorName: replyingTo?.opAuthorName || null,
        opContent: replyingTo?.opContent || null,
      });
      await fetchComments();
      editor.commands.clearContent();
      setReplyingTo(null);
      toast.success("댓글이 성공적으로 추가되었습니다.");
    } catch (error) {
      console.error("댓글 추가 중 오류:", error);
      toast.error("댓글 추가에 실패했습니다.");
    }
  };

  // 댓글 삭제 함수 추가
  const handleDeleteComment = async (commentId) => {
    try {
      await ForumApi.deleteComment(commentId, user.id, user.admin);
      toast.success("댓글이 삭제되었습니다.");
      await fetchComments();
    } catch (error) {
      console.error("댓글 삭제 중 오류:", error);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  // 게시글 인용(답글) 요청 처리: PostDetail에서 전달받은 postToReply가 있을 경우 처리
  useEffect(() => {
    if (postToReply && editor) {
      handleReplyToPost(postToReply);
      // 한 번 처리 후 상태 초기화
      setPostToReply(null);
    }
  }, [postToReply, editor, setPostToReply]);

  // 게시글 인용(답글) 처리 함수
  const handleReplyToPost = (post) => {
    const quotedBlock = createReplyBlock(post);
    const current = editor.getJSON();
    const newContent =
      !current.content || current.content.length === 0
        ? {
            type: "doc",
            content: [quotedBlock, { type: "paragraph", content: [] }],
          }
        : { ...current, content: [quotedBlock, ...current.content] };

    editor.commands.setContent(newContent);
    editor.chain().focus().run();

    setReplyingTo({
      type: "post",
      opAuthorName: post.authorName,
      opContent: post.contentJSON
        ? typeof post.contentJSON === "string"
          ? post.contentJSON
          : JSON.stringify(post.contentJSON)
        : JSON.stringify(convertHtmlToJson(post.content)),
    });
    toast.info(`${post.authorName}님의 게시글을 인용합니다.`);
  };

  // 기존 댓글 인용(답글) 함수 (댓글 인용 시)
  const handleReply = (target, type) => {
    if (!editor) return;
    const quotedBlock = createReplyBlock(target);
    const current = editor.getJSON();
    const newContent =
      !current.content || current.content.length === 0
        ? {
            type: "doc",
            content: [quotedBlock, { type: "paragraph", content: [] }],
          }
        : { ...current, content: [quotedBlock, ...current.content] };

    editor.commands.setContent(newContent);
    editor.chain().focus().run();

    if (type === "comment") {
      setReplyingTo({ type, parentCommentId: target.id });
    }
    toast.info(`${target.authorName}님의 내용을 인용합니다.`);
  };

  // 댓글 좋아요 함수
  const handleLikeComment = async (commentId) => {
    try {
      // 여기서 postId는 해당 댓글이 속한 게시글의 ID를 의미합니다.
      const updated = await ForumApi.toggleLikeComment(
        commentId,
        user.id,
        postId
      );
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likesCount: updated.likesCount, liked: updated.liked }
            : c
        )
      );
      toast.success("댓글 좋아요 상태가 변경되었습니다.");
    } catch (error) {
      console.error("댓글 좋아요 오류:", error);
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  if (loading) return <div>댓글 로딩 중...</div>;

  return (
    <div>
      <CommentList
        comments={comments}
        memberId={user.id}
        isAdmin={user.admin}
        onDeleteComment={handleDeleteComment}
        onLikeComment={handleLikeComment}
        onReply={handleReply}
      />

      <CommentInput
        editor={editor}
        replyingTo={replyingTo}
        onAddComment={handleAddComment}
        onCancelReply={() => setReplyingTo(null)}
        onAddLink={() => {}}
      />
    </div>
  );
};

export default CommentsContainer;
