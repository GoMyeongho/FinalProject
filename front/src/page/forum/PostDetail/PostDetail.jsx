// PostDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ForumApi from "../../../api/ForumApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PostDetailContainer,
  ReplyQuoteGlobalStyle,
  GlobalKeyframes,
  PostTitle,
  HiddenCommentNotice,
} from "../style/PostDetailStyles";
import PostBox from "./PostBox";
import CommentsContainer from "./CommentsContainer";
import Commons from "../../../util/Common";
import styled from "styled-components";
import { useSelector } from "react-redux";
import ConfirmationModal from "../ConfirmationModal";
import { createReplyBlock } from "./replyUtils";

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #ccc;
  margin: 1rem 0;
`;

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    type: "",
    id: null,
    content: "",
  });
  // 게시글 인용 요청을 위한 상태 (PostDetail → CommentsContainer)
  const [postToReply, setPostToReply] = useState(null);

  // 좋아요 처리 함수 (게시글 좋아요 토글)
  const handleLikePost = async (postId) => {
    try {
      const updatedPost = await ForumApi.toggleLikePost(postId, user.id);
      // updatedPost가 { liked: true/false, totalLikes: number }로 오는데,
      // 만약 백엔드에서 totalLikes 대신 likesCount를 보내면 아래처럼 변경:
      setPost((prev) => ({
        ...prev,
        likesCount: updatedPost.likesCount, // 변경: totalLikes -> likesCount
        liked: updatedPost.liked,
      }));
      toast.success("게시글 좋아요 상태가 변경되었습니다.");
    } catch (error) {
      console.error("게시글 좋아요 처리 중 오류:", error);
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  // 좋아요 처리 함수 (댓글 좋아요 토글)
  const handleLikeComment = async (commentId) => {
    try {
      // 댓글 좋아요 토글 API 호출 (user.id 사용)
      const updatedComment = await ForumApi.toggleLikeComment(
        commentId,
        user.id
      );
      // 댓글 좋아요 상태는 CommentsContainer 내부에서 개별적으로 처리할 수 있습니다.
      toast.success("댓글 좋아요 상태가 변경되었습니다.");
    } catch (error) {
      console.error("댓글 좋아요 처리 중 오류:", error);
      toast.error("좋아요 처리에 실패했습니다.");
    }
  };

  // 게시글 인용(답글) 처리 함수
  const handleReply = (target, type) => {
    if (type === "post") {
      // 게시글 인용 요청 상태를 업데이트
      setPostToReply(target);
    } else {
      // 댓글 인용은 기존처럼 바로 처리 (CommentsContainer 내의 handleReply 사용)
      console.log("댓글 인용 처리:", target);
    }
    toast.info(`${target.authorName}님의 내용을 인용합니다.`);
  };

  // 모달 열기 함수
  const openModal = (type, id, content) => {
    setModalData({ type, id, content });
    setIsModalOpen(true);
  };

  // 모달 확인 버튼 클릭 시 처리 함수
  const handleModalConfirm = async (inputVal) => {
    switch (modalData.type) {
      case "deletePost":
        console.log("게시글 삭제:", modalData.id);
        // 예: await ForumApi.deletePost(modalData.id, user.id, ...);
        toast.success("게시글이 삭제되었습니다.");
        navigate("/forum");
        break;
      case "editPostContent":
        console.log("게시글 내용 수정:", modalData.id, "새 내용:", inputVal);
        // 예: await ForumApi.updatePostContent(modalData.id, { contentJSON: inputVal }, user.id, user.admin);
        toast.success("게시글 내용이 수정되었습니다.");
        break;
      case "reportPost":
        console.log("게시글 신고:", modalData.id, "신고 사유:", inputVal);
        // 예: await ForumApi.reportPost(modalData.id, user.id, inputVal);
        toast.success("게시글 신고가 접수되었습니다.");
        break;
      default:
        console.log("모달 액션:", modalData.type, "입력값:", inputVal);
    }
    setIsModalOpen(false);
  };

  // 모달 취소 함수
  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  // 게시글 데이터 불러오기
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const postData = await ForumApi.getPostById(postId);
        setPost(postData);
      } catch (error) {
        console.error("게시글 로딩 중 오류:", error);
        toast.error("게시글 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchPostData();
  }, [postId, navigate]);

  return (
    <PostDetailContainer>
      <ReplyQuoteGlobalStyle />
      <GlobalKeyframes />

      {loading ? (
        <div>로딩 중...</div>
      ) : !post ? (
        <div>게시글을 찾을 수 없습니다.</div>
      ) : (
        <>
          <PostTitle>
            {post.hidden ? (
              <HiddenCommentNotice>
                NOTICE: 해당 게시글은 삭제되거나 숨김 처리되었습니다.
              </HiddenCommentNotice>
            ) : (
              <span>{post.title}</span>
            )}
          </PostTitle>
          <div style={{ color: "#777", marginBottom: "1rem" }}>
            생성일: {Commons.formatDateAndTime(post.createdAt)}
          </div>

          <PostBox
            post={post}
            memberId={user.id}
            isAdmin={user.admin}
            loading={loading}
            // 게시글 삭제, 수정, 신고, 복원, 좋아요, 인용 등 처리 함수 전달
            onDeletePost={(pid) => openModal("deletePost", pid, "")}
            onEditPostContent={(pid, cJSON) =>
              openModal("editPostContent", pid, cJSON)
            }
            onReportPost={(pid, content) =>
              openModal("reportPost", pid, content)
            }
            onRestorePost={(pid) => openModal("restorePost", pid, "")}
            onLikePost={handleLikePost}
            onReplyPost={handleReply}
          />

          <Divider />

          {/* CommentsContainer에 게시글 인용과 댓글 좋아요 처리 함수 전달 */}
          <CommentsContainer
            postId={postId}
            user={user}
            postToReply={postToReply}
            setPostToReply={setPostToReply}
            onLikeComment={handleLikeComment} // 댓글 좋아요 처리 함수 전달
          />
        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* ConfirmationModal 렌더링 */}
      <ConfirmationModal
        isOpen={isModalOpen}
        type={modalData.type}
        content={modalData.content}
        message="진행 하시겠습니까?"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </PostDetailContainer>
  );
};

export default PostDetail;
