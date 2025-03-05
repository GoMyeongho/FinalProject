// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { getUserInfo } from "../../../axios/AxiosInstanse";
// import ForumApi from "../../../api/ForumApi";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // 스타일 컴포넌트 및 글로벌 스타일 임포트
// import {
//   PostDetailContainer,
//   ReplyQuoteGlobalStyle,
//   GlobalKeyframes,
//   PostTitle,
//   HiddenCommentNotice,
//   AdminEditIndicator,
//   EditButton,
//   DisabledEditButton,
// } from "../../../styles/PostDetailStyles";

// // 하위 컴포넌트 임포트
// import PostBox from "./PostBox"; // 게시글 정보 및 액션 버튼 렌더링
// import CommentList from "./CommentList";
// import CommentInput from "./CommentInput";
// import ConfirmationModal from "../ConfirmationModal";

// // TipTap 에디터 관련 임포트
// import { useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Bold from "@tiptap/extension-bold";
// import Italic from "@tiptap/extension-italic";
// import Underline from "@tiptap/extension-underline";
// import Link from "@tiptap/extension-link";
// import TextStyle from "@tiptap/extension-text-style";
// import Blockquote from "@tiptap/extension-blockquote";

// // FontAwesome 아이콘 임포트
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEdit } from "@fortawesome/free-solid-svg-icons";

// // HTML을 텍스트로 변환하는 유틸 함수 (HTML→JSON fallback)
// // 기존 stripHTML 함수는 document.createElement()를 사용했으나,
// // 이를 정규 표현식으로 대체하여 직접 DOM 접근 없이 HTML 태그를 제거합니다.
// const stripHTML = (html) => {
//   // 모든 HTML 태그를 공백으로 치환 (간단한 방법)
//   return html.replace(/<[^>]*>/g, "");
// };

// const convertHtmlToJson = (html) => {
//   const plainText = stripHTML(html);
//   return {
//     type: "doc",
//     content: [
//       {
//         type: "paragraph",
//         content: [{ type: "text", text: plainText }],
//       },
//     ],
//   };
// };

// const PostDetail = () => {
//   const { postId } = useParams();
//   const navigate = useNavigate();

//   // 주요 상태값들
//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   const [replyingTo, setReplyingTo] = useState(null);
//   const [memberId, setMemberId] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // 모달 관련 상태값
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalData, setModalData] = useState({
//     type: "",
//     id: null,
//     content: "",
//   });

//   // 새 댓글 작성을 위한 에디터 설정
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Bold,
//       Italic,
//       Underline,
//       Link.configure({ openOnClick: false }),
//       TextStyle,
//       Blockquote,
//     ],
//     content: "",
//   });

//   /** 로그인된 사용자 정보를 가져오는 함수 */
//   const fetchMemberData = async () => {
//     try {
//       const userInfo = await getUserInfo();
//       if (userInfo && userInfo.memberId) {
//         setMemberId(userInfo.memberId);
//         setIsAdmin(userInfo.role === "ADMIN");
//       } else {
//         toast.error("로그인이 필요합니다.");
//         navigate("/login");
//       }
//     } catch (error) {
//       console.error("사용자 정보를 가져오는 중 오류:", error);
//       toast.error("사용자 정보를 확인할 수 없습니다.");
//       navigate("/login");
//     }
//   };

//   /** 게시글 및 댓글 데이터를 가져오는 함수 */
//   useEffect(() => {
//     const fetchPostData = async () => {
//       try {
//         await fetchMemberData();
//         const postData = await ForumApi.getPostById(postId);
//         console.log("Fetched postData (raw):", postData);

//         // If it’s a string, parse it, then log it
//         if (postData.contentJSON && typeof postData.contentJSON === "string") {
//           try {
//             const parsed = JSON.parse(postData.contentJSON);
//             console.log("Fetched postData.contentJSON (parsed):", parsed);
//           } catch (err) {
//             console.warn("Failed to parse postData.contentJSON:", err);
//           }
//         }
//         const commentData = await ForumApi.getCommentsByPostId(postId);

//         // 게시글 contentJSON 파싱 (없으면 HTML을 JSON으로 변환)
//         if (postData.contentJSON) {
//           try {
//             if (typeof postData.contentJSON === "string") {
//               postData.contentJSON = JSON.parse(postData.contentJSON);
//             }
//           } catch {
//             postData.contentJSON = convertHtmlToJson(postData.content);
//           }
//         } else if (postData.content) {
//           postData.contentJSON = convertHtmlToJson(postData.content);
//         }

//         // 관리자 수정 여부 설정
//         postData.editedByAdminTitle = postData.editedByTitle === "ADMIN";
//         postData.editedByAdminContent = postData.editedByContent === "ADMIN";

//         // 댓글의 contentJSON 파싱
//         const sortedComments = commentData.sort(
//           (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//         );
//         sortedComments.forEach((comment) => {
//           if (comment.contentJSON) {
//             try {
//               if (typeof comment.contentJSON === "string") {
//                 comment.contentJSON = JSON.parse(comment.contentJSON);
//               }
//             } catch {
//               comment.contentJSON = convertHtmlToJson(comment.content);
//             }
//           } else if (comment.content) {
//             comment.contentJSON = convertHtmlToJson(comment.content);
//           }
//         });

//         setPost(postData);
//         setComments(sortedComments);
//       } catch (error) {
//         console.error("게시글 로딩 중 오류:", error);
//         toast.error("게시글 데이터를 불러오는 중 오류가 발생했습니다.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchPostData();
//   }, [postId, navigate]);

//   /** 모달을 열 때 사용하는 함수 (작업 유형, ID, 내용을 설정) */
//   const openModal = (type, id, content) => {
//     // content 기반 작업(편집 등)의 경우 JSON 문자열로 변환
//     if (type === "editPostContent" || type === "editComment") {
//       content = typeof content === "string" ? content : JSON.stringify(content);
//     }
//     setModalData({ type, id, content });
//     setIsModalOpen(true);
//   };

//   /** 모달에서 확인 버튼 클릭 시 처리하는 함수 */
//   const handleModalConfirm = async (inputVal) => {
//     const { type, id } = modalData;
//     try {
//       switch (type) {
//         case "deletePost": {
//           const removedBy =
//             memberId === post.memberId ? post.authorName : "ADMIN";
//           await ForumApi.deletePost(id, memberId, removedBy, isAdmin);
//           toast.success("게시글이 삭제되었습니다.");
//           navigate("/forum");
//           break;
//         }
//         case "editPostTitle": {
//           if (!inputVal.trim()) return toast.warning("제목을 입력해 주세요.");
//           const updatedTitle = await ForumApi.updatePostTitle(
//             id,
//             { title: inputVal },
//             memberId,
//             isAdmin
//           );
//           setPost((prev) => ({
//             ...prev,
//             title: updatedTitle.title,
//             editedByAdminTitle: updatedTitle.editedByTitle === "ADMIN",
//           }));
//           toast.success("게시글 제목이 수정되었습니다.");
//           break;
//         }
//         case "editPostContent": {
//           if (!inputVal.trim()) return toast.warning("내용을 입력해 주세요.");
//           let jsonContent;
//           try {
//             jsonContent = JSON.parse(inputVal);
//           } catch {
//             return toast.error("잘못된 JSON 형식입니다.");
//           }
//           const updated = await ForumApi.updatePostContent(
//             id,
//             { contentJSON: JSON.stringify(jsonContent) },
//             memberId,
//             isAdmin
//           );
//           setPost((prev) => ({
//             ...prev,
//             contentJSON: JSON.parse(updated.contentJSON),
//             editedByAdminContent: updated.editedByContent === "ADMIN",
//           }));
//           toast.success("게시글 내용이 수정되었습니다.");
//           break;
//         }
//         case "editComment": {
//           if (!inputVal.trim())
//             return toast.warning("댓글 내용을 입력해 주세요.");
//           let jsonContent;
//           try {
//             jsonContent = JSON.parse(inputVal);
//           } catch {
//             return toast.error("잘못된 JSON 형식입니다.");
//           }
//           const updatedComment = await ForumApi.editComment(
//             id,
//             { contentJSON: JSON.stringify(jsonContent) },
//             memberId,
//             isAdmin
//           );
//           if (typeof updatedComment.contentJSON === "string") {
//             try {
//               updatedComment.contentJSON = JSON.parse(
//                 updatedComment.contentJSON
//               );
//             } catch {
//               updatedComment.contentJSON = convertHtmlToJson(
//                 updatedComment.content
//               );
//             }
//           }
//           setComments((prev) =>
//             prev.map((c) => (c.id === id ? { ...c, ...updatedComment } : c))
//           );
//           toast.success("댓글이 성공적으로 수정되었습니다.");
//           break;
//         }
//         case "deleteComment": {
//           await ForumApi.deleteComment(id, memberId, isAdmin);
//           setComments((prev) =>
//             prev.map((c) =>
//               c.id === id
//                 ? {
//                     ...c,
//                     contentJSON: {
//                       content: [{ type: "paragraph", content: [] }],
//                     },
//                     hidden: true,
//                   }
//                 : c
//             )
//           );
//           toast.success("댓글이 삭제되었습니다.");
//           break;
//         }
//         case "restorePost": {
//           if (!isAdmin) {
//             toast.error("권한이 없습니다. 관리자만 복원할 수 있습니다.");
//             return;
//           }
//           await ForumApi.restorePost(id);
//           const restoredPost = await ForumApi.getPostById(id);
//           if (
//             restoredPost.contentJSON &&
//             typeof restoredPost.contentJSON === "string"
//           ) {
//             try {
//               restoredPost.contentJSON = JSON.parse(restoredPost.contentJSON);
//             } catch {
//               restoredPost.contentJSON = convertHtmlToJson(
//                 restoredPost.content
//               );
//             }
//           }
//           setPost(restoredPost);
//           toast.success("게시글이 성공적으로 복원되었습니다.");
//           break;
//         }
//         case "restoreComment": {
//           await ForumApi.restoreComment(id);
//           // 서버 업데이트를 기다리기 위해 잠시 대기 후 댓글 재갱신
//           setTimeout(async () => {
//             const commentData = await ForumApi.getCommentsByPostId(postId);
//             const sorted = commentData.sort(
//               (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//             );
//             sorted.forEach((com) => {
//               if (com.contentJSON && typeof com.contentJSON === "string") {
//                 try {
//                   com.contentJSON = JSON.parse(com.contentJSON);
//                 } catch {
//                   com.contentJSON = convertHtmlToJson(com.content);
//                 }
//               }
//             });
//             setComments(sorted);
//             toast.success("댓글이 복원되었습니다.");
//           }, 250);
//           break;
//         }
//         case "reportPost": {
//           if (!inputVal.trim()) {
//             toast.warning("신고 사유를 입력해주세요.");
//             return;
//           }
//           // postId = id, reporterId = memberId, reason = inputVal
//           await ForumApi.reportPost(id, memberId, inputVal.trim());
//           toast.success("게시글 신고가 접수되었습니다.");
//           break;
//         }

//         case "reportComment": {
//           if (!inputVal.trim()) {
//             toast.warning("신고 사유를 입력해주세요.");
//             return;
//           }
//           // commentId = id, reporterId = memberId, reason = inputVal
//           await ForumApi.reportComment(id, memberId, inputVal.trim());
//           toast.success("댓글 신고가 접수되었습니다.");
//           break;
//         }
//         case "addLink": {
//           if (!inputVal.trim()) return toast.warning("URL을 입력해주세요.");
//           let url = inputVal.trim();
//           if (!/^https?:\/\//i.test(url)) {
//             url = "https://" + url;
//           }
//           editor
//             .chain()
//             .focus()
//             .extendMarkRange("link")
//             .setLink({ href: url })
//             .run();
//           toast.success("링크가 성공적으로 추가되었습니다.");
//           break;
//         }
//         default:
//           toast.error("알 수 없는 작업입니다.");
//       }
//     } catch (error) {
//       console.error(`${modalData.type} 처리 중 오류:`, error);
//       toast.error("작업 처리 중 오류가 발생했습니다.");
//     } finally {
//       setIsModalOpen(false);
//     }
//   };

//   /** 답글(인용) 취소 함수 */
//   const resetReplying = () => setReplyingTo(null);

//   /** "Link" 버튼 클릭 시 모달을 여는 함수 */
//   const handleAddLink = () => {
//     openModal("addLink", null, "");
//   };

//   /** 인용(답글) 생성 함수 (원본 링크 기능 제거됨)
//    * 기존에는 인용문에 원본 링크를 포함했으나, 해당 기능을 제거했습니다.
//    */
//   const filterEmptyParagraphs = (nodes) => {
//     if (!nodes || !Array.isArray(nodes)) return [];
//     return nodes.filter((node) => {
//       if (node.type === "paragraph") {
//         if (!node.content || node.content.length === 0) return false;
//         const text = node.content
//           .map((n) => n.text || "")
//           .join("")
//           .trim();
//         return text !== "";
//       }
//       return true;
//     });
//   };
//   const handleReply = (target, type) => {
//     // 1. 답글 상태 설정 (OP 인용과 댓글 인용 구분)
//     if (type === "post") {
//       setReplyingTo({
//         type,
//         opAuthorName: target.authorName,
//         opContent: target.contentJSON
//           ? typeof target.contentJSON === "string"
//             ? target.contentJSON
//             : JSON.stringify(target.contentJSON)
//           : JSON.stringify(convertHtmlToJson(target.content)),
//       });
//     } else {
//       setReplyingTo({ type, parentCommentId: target.id });
//     }

//     // 2. target의 contentJSON 유효성 검사 및 fallback 처리
//     let parsedJson;
//     if (target.contentJSON) {
//       if (typeof target.contentJSON === "string") {
//         try {
//           parsedJson = JSON.parse(target.contentJSON);
//         } catch (err) {
//           // 파싱 실패 시 fallback: HTML 문자열을 JSON으로 변환
//           parsedJson = convertHtmlToJson(target.content);
//         }
//       } else {
//         parsedJson = target.contentJSON;
//       }
//     } else {
//       parsedJson = convertHtmlToJson(target.content);
//     }

//     // 3. blockquote 내부에 들어갈 내용 추출
//     const rawBody = (parsedJson && parsedJson.content) || [];
//     const filteredBody = filterEmptyParagraphs(rawBody);

//     const headerParagraph = {
//       type: "paragraph",
//       attrs: { class: "reply-quote-header" },
//       content: [
//         { type: "text", text: `${target.authorName}님이 말씀하셨습니다:` },
//       ],
//     };

//     const bodyParagraph = {
//       type: "paragraph",
//       attrs: { class: "reply-quote-body" },
//       content:
//         filteredBody.length > 0
//           ? filteredBody
//           : [{ type: "text", text: "(내용이 없습니다.)" }],
//     };

//     // 4. blockquote 객체 생성 (원본 링크 기능 제거)
//     const quotedContent = {
//       type: "blockquote",
//       attrs: { class: "reply-quote" },
//       content: [headerParagraph, bodyParagraph],
//     };

//     // 5. 에디터 현재 콘텐츠에 인용 블록 추가
//     const current = editor.getJSON();
//     const newContent =
//       !current.content || current.content.length === 0
//         ? {
//             type: "doc",
//             content: [quotedContent, { type: "paragraph", content: [] }],
//           }
//         : { ...current, content: [quotedContent, ...current.content] };

//     editor.commands.setContent(newContent);
//     editor.chain().focus().run();
//     toast.info(`${target.authorName}님의 내용을 인용합니다.`);
//   };

//   /** 새 댓글 추가 함수 */
//   const handleAddComment = async () => {
//     const jsonData = editor.getJSON();
//     const htmlData = editor.getHTML();
//     if (!jsonData || !jsonData.content || jsonData.content.length === 0) {
//       toast.warning("댓글이 비어있거나 잘못된 형식입니다.");
//       return;
//     }
//     try {
//       const response = await ForumApi.addComment({
//         postId: post.id,
//         memberId,
//         content: htmlData,
//         contentJSON: JSON.stringify(jsonData),
//         parentCommentId: replyingTo?.parentCommentId || null,
//         opAuthorName: replyingTo?.opAuthorName || null,
//         opContent: replyingTo?.opContent || null,
//       });
//       if (typeof response.contentJSON === "string") {
//         try {
//           response.contentJSON = JSON.parse(response.contentJSON);
//         } catch {
//           response.contentJSON = convertHtmlToJson(response.content);
//         }
//       }
//       const newComment = {
//         ...response,
//         reportCount: response.reportCount || 0,
//       };
//       setComments((prev) =>
//         [...prev, newComment].sort(
//           (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//         )
//       );
//       editor.commands.clearContent();
//       setReplyingTo(null);
//       toast.success("댓글이 성공적으로 추가되었습니다.");
//     } catch (error) {
//       console.error("댓글 추가 중 오류:", error);
//       toast.error("댓글 추가에 실패했습니다.");
//     }
//   };

//   /** 게시글 좋아요 토글 함수 */
//   const handleLikePost = async () => {
//     try {
//       if (!memberId) await fetchMemberData();
//       if (!memberId) return;
//       const updatedPost = await ForumApi.toggleLikePost(post.id, memberId);
//       setPost((prev) => ({
//         ...prev,
//         likesCount: updatedPost.totalLikes,
//         liked: updatedPost.liked,
//       }));
//       toast.success("게시글 좋아요 상태가 변경되었습니다.");
//     } catch (error) {
//       console.error("게시글 좋아요 오류:", error);
//       toast.error("좋아요 처리에 실패했습니다.");
//     }
//   };

//   /** 댓글 좋아요 토글 함수 */
//   const handleLikeComment = async (commentId) => {
//     try {
//       if (!memberId) await fetchMemberData();
//       if (!memberId) return;
//       const updatedComment = await ForumApi.toggleLikeComment(
//         commentId,
//         memberId
//       );
//       setComments((prev) =>
//         prev.map((c) =>
//           c.id === commentId
//             ? {
//                 ...c,
//                 likesCount: updatedComment.totalLikes,
//                 liked: updatedComment.liked,
//               }
//             : c
//         )
//       );
//       toast.success("댓글 좋아요 상태가 변경되었습니다.");
//     } catch (error) {
//       console.error("댓글 좋아요 오류:", error);
//       toast.error("좋아요 처리에 실패했습니다.");
//     }
//   };

//   // 게시글 제목 인라인 수정용 핸들러
//   const handleEditTitleClick = () => {
//     openModal("editPostTitle", post.id, post.title);
//   };

//   if (loading) return <div>로딩 중...</div>;
//   if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

//   return (
//     <PostDetailContainer>
//       <ReplyQuoteGlobalStyle />
//       <GlobalKeyframes />

//       {/* (A) 게시글 제목 영역 */}
//       <PostTitle>
//         {post.hidden ? (
//           <HiddenCommentNotice>
//             NOTICE: 해당 게시글은 삭제되거나 숨김 처리되었습니다.
//           </HiddenCommentNotice>
//         ) : (
//           <>
//             <span>
//               {post.title}
//               {post.editedByAdminTitle && (
//                 <AdminEditIndicator>
//                   [관리자에 의해 제목 수정됨]
//                 </AdminEditIndicator>
//               )}
//             </span>
//             {memberId === post.memberId &&
//               !isAdmin &&
//               !post.editedByAdminTitle && (
//                 <EditButton
//                   onClick={handleEditTitleClick}
//                   aria-label="Edit Title"
//                 >
//                   <FontAwesomeIcon icon={faEdit} />
//                 </EditButton>
//               )}
//             {isAdmin &&
//               (!post.editedByAdminTitle || memberId !== post.memberId) && (
//                 <EditButton
//                   onClick={handleEditTitleClick}
//                   aria-label="Edit Title"
//                 >
//                   <FontAwesomeIcon icon={faEdit} />
//                 </EditButton>
//               )}
//             {post.editedByAdminTitle &&
//               memberId === post.memberId &&
//               !isAdmin && (
//                 <DisabledEditButton aria-label="Edit Disabled by Admin">
//                   <FontAwesomeIcon icon={faEdit} />
//                 </DisabledEditButton>
//               )}
//           </>
//         )}
//       </PostTitle>

//       {/* (B) 게시글 본문 박스 */}
//       <PostBox
//         post={post}
//         memberId={memberId}
//         isAdmin={isAdmin}
//         loading={loading}
//         onDeletePost={(pid) => openModal("deletePost", pid, "")}
//         onEditPostContent={(pid, cJSON) =>
//           openModal("editPostContent", pid, cJSON)
//         }
//         onReportPost={(pid, content) => openModal("reportPost", pid, content)}
//         onRestorePost={(pid) => openModal("restorePost", pid, "")}
//         onLikePost={handleLikePost}
//         onReplyPost={handleReply}
//       />

//       {/* (C) 댓글 리스트 영역 */}
//       <CommentList
//         comments={comments}
//         memberId={memberId}
//         isAdmin={isAdmin}
//         onDeleteComment={(cid) => openModal("deleteComment", cid, "")}
//         onEditComment={(cid, cJSON) => openModal("editComment", cid, cJSON)}
//         onReportComment={(cid, content) =>
//           openModal("reportComment", cid, content)
//         }
//         onLikeComment={handleLikeComment}
//         onReply={handleReply}
//         onRestoreComment={(cid) => openModal("restoreComment", cid, "")}
//       />

//       {/* (D) 댓글 입력 영역 */}
//       <CommentInput
//         editor={editor}
//         replyingTo={replyingTo}
//         onAddLink={() => openModal("addLink", null, "")}
//         onAddComment={handleAddComment}
//         onCancelReply={() => setReplyingTo(null)}
//       />

//       {/* (E) 확인 모달 */}
//       <ConfirmationModal
//         isOpen={isModalOpen}
//         type={modalData.type}
//         content={modalData.content}
//         message={"진행 하시겠습니까?"}
//         onConfirm={handleModalConfirm}
//         onCancel={() => setIsModalOpen(false)}
//       />

//       <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
//     </PostDetailContainer>
//   );
// };

// export default PostDetail;
