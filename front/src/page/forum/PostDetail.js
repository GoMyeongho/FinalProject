// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom"; // URL에서 postId 추출 및 리디렉션 처리
// import { getUserInfo } from "../../../axios/AxiosInstanse"; // 사용자 정보 API 호출
// import ForumApi from "../../../api/ForumApi"; // 포럼 API 호출
// import { ToastContainer, toast } from "react-toastify"; // 토스트 메시지 라이브러리
// import "react-toastify/dist/ReactToastify.css";

// // PostDetail 관련 스타일 컴포넌트 임포트
// import {
//   PostDetailContainer,
//   PostHeader,
//   PostTitle,
//   ContentInfo,
//   AuthorInfo,
//   ActionButtons,
//   CommentSection,
//   CommentCard,
//   CommentContent,
//   CommentInputSection,
//   HiddenCommentNotice,
//   EditButton,
//   AdminEditIndicator,
//   DisabledEditButton,
//   ReportCountText,
//   InlineBlockContainer,
//   ReplyQuoteGlobalStyle,
//   GlobalKeyframes,
// } from "../../../styles/PostDetailStyles";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faEdit,
//   faThumbsUp,
//   faReply,
//   faDeleteLeft,
//   faCircleExclamation,
//   faUndo,
//   faSpinner,
// } from "@fortawesome/free-solid-svg-icons";
// import ConfirmationModal from "../ConfirmationModal";

// // 읽기 전용 에디터 (TipTap JSON 렌더링)
// import ReadOnlyEditor from "../ReadOnlyEditor";

// // 편집용 에디터 (댓글 작성 시 사용)
// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Bold from "@tiptap/extension-bold";
// import Italic from "@tiptap/extension-italic";
// import Underline from "@tiptap/extension-underline";
// import Link from "@tiptap/extension-link";
// import TextStyle from "@tiptap/extension-text-style";
// import Blockquote from "@tiptap/extension-blockquote";

// // HTML 태그 제거 (fallback용) 및 HTML→JSON 변환 함수
// const stripHTML = (html) => {
//   const tempDiv = document.createElement("div");
//   tempDiv.innerHTML = html;
//   return tempDiv.textContent || tempDiv.innerText || "";
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

// // KR: JSON 콘텐츠가 유효한지 (최상위 "doc" 포함) 확인하는 함수
// const isValidJSONContent = (json) =>
//   json &&
//   ((json.type === "doc" &&
//     Array.isArray(json.content) &&
//     json.content.length > 0) ||
//     (json.content && Array.isArray(json.content) && json.content.length > 0));

// // KR: Fallback component to render HTML directly if needed.
// const HtmlContent = ({ html }) => (
//   <div dangerouslySetInnerHTML={{ __html: html }} />
// );

// const PostDetail = () => {
//   const { postId } = useParams();
//   const navigate = useNavigate();

//   const [post, setPost] = useState(null);
//   const [comments, setComments] = useState([]);
//   // KR: replyingTo는 reply(인용) 버튼 클릭 시만 설정됩니다.
//   const [replyingTo, setReplyingTo] = useState(null);
//   const [memberId, setMemberId] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [loadingCommentId, setLoadingCommentId] = useState(null);
//   const [prevPost, setPrevPost] = useState(null);
//   const [prevComments, setPrevComments] = useState([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalData, setModalData] = useState({
//     type: "",
//     id: null,
//     content: "",
//   });

//   // KR: 댓글 입력을 위한 에디터 (새 댓글 작성 시 사용)
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

//   // KR: 로그인 사용자 정보 로딩
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

//   // KR: 게시글 및 댓글 데이터를 불러옵니다.
//   useEffect(() => {
//     const fetchPostData = async () => {
//       try {
//         await fetchMemberData();
//         const postData = await ForumApi.getPostById(postId);
//         const commentData = await ForumApi.getCommentsByPostId(postId);

//         // KR: TipTap JSON 파싱; 실패하면 HTML→JSON 변환 fallback
//         if (postData.contentJSON) {
//           try {
//             if (typeof postData.contentJSON === "string") {
//               postData.contentJSON = JSON.parse(postData.contentJSON);
//             }
//           } catch (err) {
//             console.error("게시글 contentJSON 파싱 실패:", err);
//             postData.contentJSON = convertHtmlToJson(postData.content);
//           }
//         } else if (postData.content) {
//           postData.contentJSON = convertHtmlToJson(postData.content);
//         }

//         const processedPost = {
//           ...postData,
//           editedByAdminTitle: postData.editedByTitle === "ADMIN",
//           editedByAdminContent: postData.editedByContent === "ADMIN",
//         };
//         setPost(processedPost);

//         const sortedComments = commentData.sort(
//           (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//         );
//         sortedComments.forEach((comment) => {
//           if (comment.contentJSON) {
//             try {
//               if (typeof comment.contentJSON === "string") {
//                 comment.contentJSON = JSON.parse(comment.contentJSON);
//               }
//             } catch (err) {
//               console.error("댓글 contentJSON 파싱 실패:", err);
//               comment.contentJSON = convertHtmlToJson(comment.content);
//             }
//           } else if (comment.content) {
//             comment.contentJSON = convertHtmlToJson(comment.content);
//           }
//         });
//         setComments(sortedComments);
//       } catch (error) {
//         console.error("게시글 로딩 중 오류:", error);
//         toast.error("게시글 데이터를 불러오는 중 오류가 발생했습니다.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchPostData();
//   }, [postId]);

//   // KR: 모달 열기 - 작업 유형, 대상 ID, 기존 콘텐츠(문자열) 저장
//   const openModal = (type, id, content) => {
//     if (type === "editPostContent" || type === "editComment") {
//       content = typeof content === "string" ? content : JSON.stringify(content);
//     }
//     setModalData({ type, id, content });
//     setIsModalOpen(true);
//   };

//   // KR: reply 상태 초기화 (인용 취소)
//   const resetReplying = () => {
//     setReplyingTo(null);
//   };

//   // KR: 모달 Confirm 처리 함수 (편집, 삭제, 신고 등)
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
//           } catch (err) {
//             console.error("유효하지 않은 JSON 형식입니다:", err);
//             return toast.error("잘못된 JSON 형식입니다.");
//           }
//           const updatedContent = await ForumApi.updatePostContent(
//             id,
//             { contentJSON: JSON.stringify(jsonContent) },
//             memberId,
//             isAdmin
//           );
//           setPost((prev) => ({
//             ...prev,
//             contentJSON: JSON.parse(updatedContent.contentJSON),
//             editedByAdminContent: updatedContent.editedByContent === "ADMIN",
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
//           } catch (err) {
//             console.error("유효하지 않은 JSON 형식입니다:", err);
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
//             } catch (err) {
//               console.error("댓글 업데이트 후 JSON 파싱 실패:", err);
//               updatedComment.contentJSON = convertHtmlToJson(
//                 updatedComment.content
//               );
//             }
//           }
//           setComments((prevComments) =>
//             prevComments.map((comment) =>
//               comment.id === id
//                 ? {
//                     ...comment,
//                     ...updatedComment,
//                     contentJSON: updatedComment.contentJSON,
//                   }
//                 : comment
//             )
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
//         case "restoreComment": {
//           await ForumApi.restoreComment(id);
//           // 백엔드에서 데이터가 완전히 반영될 시간을 기다리기 위해 딜레이를 줍니다.
//           setTimeout(async () => {
//             const commentData = await ForumApi.getCommentsByPostId(postId);
//             const sortedComments = commentData.sort(
//               (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//             );
//             sortedComments.forEach((comment) => {
//               if (comment.contentJSON) {
//                 try {
//                   if (typeof comment.contentJSON === "string") {
//                     comment.contentJSON = JSON.parse(comment.contentJSON);
//                   }
//                 } catch (err) {
//                   console.error("댓글 contentJSON 파싱 실패:", err);
//                   comment.contentJSON = convertHtmlToJson(comment.content);
//                 }
//               } else if (comment.content) {
//                 comment.contentJSON = convertHtmlToJson(comment.content);
//               }
//             });
//             setComments(sortedComments);
//             toast.success("댓글이 복원되었습니다.");
//           }, 250); // 250ms 딜레이 (필요에 따라 조정)
//           break;
//         }

//         case "reportComment": {
//           if (!inputVal.trim())
//             return toast.warning("신고 사유를 입력해 주세요.");
//           const reportedComment = await ForumApi.reportComment(
//             id,
//             memberId,
//             inputVal
//           );
//           setComments((prev) =>
//             prev.map((c) =>
//               c.id === id
//                 ? {
//                     ...c,
//                     reportCount: reportedComment.reportCount,
//                     hasReported: true,
//                   }
//                 : c
//             )
//           );
//           toast.success("댓글이 신고되었습니다.");
//           break;
//         }
//         case "restorePost": {
//           if (!isAdmin) {
//             toast.error("권한이 없습니다. 관리자만 복원할 수 있습니다.");
//             return;
//           }
//           // Instead of only updating the hidden flag, we re-fetch the updated post from the server.
//           await ForumApi.restorePost(id);
//           const restoredPost = await ForumApi.getPostById(id);
//           if (restoredPost.contentJSON) {
//             try {
//               if (typeof restoredPost.contentJSON === "string") {
//                 restoredPost.contentJSON = JSON.parse(restoredPost.contentJSON);
//               }
//             } catch (err) {
//               console.error("복원된 게시글의 contentJSON 파싱 실패:", err);
//               restoredPost.contentJSON = convertHtmlToJson(
//                 restoredPost.content
//               );
//             }
//           } else if (restoredPost.content) {
//             restoredPost.contentJSON = convertHtmlToJson(restoredPost.content);
//           }
//           restoredPost.editedByAdminTitle =
//             restoredPost.editedByTitle === "ADMIN";
//           restoredPost.editedByAdminContent =
//             restoredPost.editedByContent === "ADMIN";
//           setPost(restoredPost);
//           toast.success("게시글이 성공적으로 복원되었습니다.");
//           break;
//         }
//         case "addLink": {
//           if (!inputVal.trim()) return toast.warning("URL을 입력해주세요.");
//           let formattedUrl = inputVal.trim();
//           if (
//             !formattedUrl.startsWith("http://") &&
//             !formattedUrl.startsWith("https://")
//           ) {
//             formattedUrl = `https://${formattedUrl}`;
//           }
//           editor
//             .chain()
//             .focus()
//             .extendMarkRange("link")
//             .setLink({ href: formattedUrl })
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

//   // KR: 기존 addLink 처리 함수 (모달 열기)
//   const handleAddLink = () => {
//     openModal("addLink", null, "");
//   };

//   // KR: Helper – 빈 paragraph 노드 제거 함수
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

//   // KR: handleReply – 인용(답글) 시 reply 메타데이터를 설정하고 인용 블록을 에디터에 삽입합니다.
//   const handleReply = (target, type) => {
//     // 기존 로직: reply 상태 설정
//     if (type === "post") {
//       setReplyingTo({
//         type,
//         opAuthorName: target.authorName,
//         opContent: JSON.stringify(target.contentJSON),
//       });
//     } else if (type === "comment") {
//       setReplyingTo({ type, parentCommentId: target.id });
//     }

//     // 기존 로직: 인용 헤더 문단
//     const headerParagraph = {
//       type: "paragraph",
//       attrs: { class: "reply-quote-header" },
//       content: [
//         { type: "text", text: `${target.authorName}님이 말씀하셨습니다:` },
//       ],
//     };

//     // 기존 로직: 인용 본문 문단 (body)
//     const rawBody = (target.contentJSON && target.contentJSON.content) || [];
//     const filteredBody = filterEmptyParagraphs(rawBody);
//     const bodyParagraph = {
//       type: "paragraph",
//       attrs: { class: "reply-quote-body" },
//       content:
//         filteredBody.length > 0 ? filteredBody : [{ type: "text", text: "" }],
//     };

//     // ★ 추가: "원본 링크 ↑" 문단
//     const linkParagraph = {
//       type: "paragraph",
//       attrs: { class: "jump-to-original" },
//       content: [
//         {
//           type: "text",
//           text: "원본 링크 ↑",
//           marks: [
//             {
//               type: "link",
//               attrs: {
//                 // 예: 게시글이면 /forum/post/:postId, 댓글이면 /forum/post/:postId#comment-:commentId
//                 href:
//                   type === "post"
//                     ? `/forum/post/${target.id}`
//                     : `/forum/post/${target.postId}#comment-${target.id}`,
//                 target: "_blank",
//               },
//             },
//           ],
//         },
//       ],
//     };

//     // 기존 로직: blockquote 노드 생성
//     const quotedContent = {
//       type: "blockquote",
//       attrs: { class: "reply-quote" },
//       content: [headerParagraph, bodyParagraph, linkParagraph], // ★ linkParagraph 추가
//     };

//     // 에디터에 새 인용 블록 삽입
//     const currentContent = editor.getJSON();
//     const newContent =
//       !currentContent.content || currentContent.content.length === 0
//         ? {
//             type: "doc",
//             content: [quotedContent, { type: "paragraph", content: [] }],
//           }
//         : {
//             ...currentContent,
//             content: [quotedContent, ...currentContent.content],
//           };

//     editor.commands.setContent(newContent);
//     editor.chain().focus().run();
//     toast.info(`${target.authorName}님의 내용을 인용합니다.`);
//   };

//   // KR: 새 댓글 추가 – reply 정보는 replyingTo로 전달되고, 추가 후에는 초기화됩니다.
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
//         } catch (err) {
//           console.error("새 댓글 contentJSON 파싱 실패:", err);
//           response.contentJSON = convertHtmlToJson(response.content);
//         }
//       }
//       const newCommentObj = {
//         ...response,
//         reportCount: response.reportCount || 0,
//       };
//       setComments((prev) => {
//         const sorted = [...prev, newCommentObj].sort(
//           (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//         );
//         return sorted;
//       });
//       editor.commands.clearContent();
//       setReplyingTo(null);
//       toast.success("댓글이 성공적으로 추가되었습니다.");
//     } catch (error) {
//       console.error("댓글 추가 중 오류:", error);
//       toast.error("댓글 추가에 실패했습니다.");
//     }
//   };

//   const handleLike = async () => {
//     try {
//       if (!memberId) await fetchMemberData();
//       if (!memberId) return;
//       const updatedPost = await ForumApi.toggleLikePost(post.id, memberId);
//       setPost((prev) => ({
//         ...prev,
//         likesCount: updatedPost.totalLikes,
//         liked: updatedPost.liked,
//       }));
//       toast.success("좋아요 상태가 변경되었습니다.");
//     } catch (error) {
//       console.error("게시글 좋아요 오류:", error);
//       toast.error("좋아요 처리에 실패했습니다.");
//     }
//   };

//   const handleLikeComment = async (commentId) => {
//     try {
//       if (!memberId) await fetchMemberData();
//       if (!memberId) return;
//       const updatedComment = await ForumApi.toggleLikeComment(
//         commentId,
//         memberId
//       );
//       setComments((prevComments) =>
//         prevComments.map((comment) =>
//           comment.id === commentId
//             ? {
//                 ...comment,
//                 likesCount: updatedComment.totalLikes,
//                 liked: updatedComment.liked,
//               }
//             : comment
//         )
//       );
//       toast.success("댓글 좋아요 상태가 변경되었습니다.");
//     } catch (error) {
//       console.error("댓글 좋아요 오류:", error);
//       toast.error("좋아요 처리에 실패했습니다.");
//     }
//   };

//   useEffect(() => {
//     if (post) setPrevPost(post);
//   }, [post]);

//   useEffect(() => {
//     if (
//       comments.length > 0 &&
//       JSON.stringify(prevComments) !== JSON.stringify(comments)
//     ) {
//       setPrevComments(comments);
//       setComments(
//         comments.map((comment) => ({
//           ...comment,
//           editedByAdmin: comment.editedBy === "ADMIN",
//         }))
//       );
//     }
//   }, [comments, prevComments]);

//   if (loading) return <div>로딩 중...</div>;
//   if (!post) return <div>게시글을 찾을 수 없습니다.</div>;

//   return (
//     <PostDetailContainer>
//       <ReplyQuoteGlobalStyle />
//       <GlobalKeyframes />

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
//                   onClick={() =>
//                     openModal("editPostTitle", post.id, post.title)
//                   }
//                   aria-label="Edit Title"
//                 >
//                   <FontAwesomeIcon icon={faEdit} />
//                 </EditButton>
//               )}
//             {isAdmin &&
//               (!post.editedByAdminTitle || memberId !== post.memberId) && (
//                 <EditButton
//                   onClick={() =>
//                     openModal("editPostTitle", post.id, post.title)
//                   }
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

//       <PostHeader>
//         <AuthorInfo>
//           <p>
//             <strong>게시자:</strong> {post.authorName}
//           </p>
//           <p>
//             <strong>생성일:</strong> {new Date(post.createdAt).toLocaleString()}
//           </p>
//         </AuthorInfo>
//         <ContentInfo>
//           {post.hidden ? (
//             <HiddenCommentNotice>
//               NOTICE: 해당 게시글은 삭제되거나 숨김 처리되었습니다.
//             </HiddenCommentNotice>
//           ) : (
//             <InlineBlockContainer>
//               <div>
//                 {isValidJSONContent(post.contentJSON) ? (
//                   <ReadOnlyEditor contentJSON={post.contentJSON} />
//                 ) : (
//                   <HtmlContent html={post.content} />
//                 )}
//               </div>
//               {post.editedByAdminContent && (
//                 <AdminEditIndicator>
//                   [관리자에 의해 내용 수정됨]
//                 </AdminEditIndicator>
//               )}
//             </InlineBlockContainer>
//           )}
//           <ActionButtons>
//             <div className="left">
//               <report-button
//                 onClick={() => openModal("reportPost", post.id, post.content)}
//                 disabled={post.hasReported}
//               >
//                 <FontAwesomeIcon icon={faCircleExclamation} />
//                 {isAdmin && post.reportCount !== undefined && (
//                   <ReportCountText>{post.reportCount}</ReportCountText>
//                 )}
//               </report-button>
//               {memberId === post.memberId && !isAdmin && (
//                 <>
//                   {!post.editedByAdminContent ? (
//                     <>
//                       <report-button
//                         onClick={() => openModal("deletePost", post.id)}
//                       >
//                         <FontAwesomeIcon icon={faDeleteLeft} />
//                       </report-button>
//                       <report-button
//                         onClick={() =>
//                           openModal(
//                             "editPostContent",
//                             post.id,
//                             post.contentJSON
//                           )
//                         }
//                       >
//                         <FontAwesomeIcon icon={faEdit} />
//                       </report-button>
//                     </>
//                   ) : (
//                     <>
//                       <disabled-button>
//                         <FontAwesomeIcon icon={faDeleteLeft} />
//                       </disabled-button>
//                       <disabled-button>
//                         <FontAwesomeIcon icon={faEdit} />
//                       </disabled-button>
//                     </>
//                   )}
//                 </>
//               )}
//               {isAdmin && (
//                 <>
//                   <admin-button
//                     onClick={() => openModal("deletePost", post.id)}
//                   >
//                     <FontAwesomeIcon icon={faDeleteLeft} />
//                   </admin-button>
//                   <admin-button
//                     onClick={() =>
//                       openModal("editPostContent", post.id, post.contentJSON)
//                     }
//                   >
//                     <FontAwesomeIcon icon={faEdit} />
//                   </admin-button>
//                 </>
//               )}
//             </div>
//             <div className="right">
//               <button onClick={handleLike}>
//                 <FontAwesomeIcon icon={faThumbsUp} /> {post.likesCount}
//               </button>
//               <button onClick={() => handleReply(post, "post")}>
//                 <FontAwesomeIcon icon={faReply} />
//               </button>
//               {isAdmin && post.hidden && (
//                 <button
//                   onClick={() => openModal("restorePost", post.id)}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <FontAwesomeIcon icon={faSpinner} spin />
//                   ) : (
//                     <>
//                       <FontAwesomeIcon icon={faUndo} /> 복원
//                     </>
//                   )}
//                 </button>
//               )}
//             </div>
//           </ActionButtons>
//         </ContentInfo>
//       </PostHeader>

//       <CommentSection>
//         <h2>댓글</h2>
//         {comments.map((comment) => (
//           <CommentCard key={comment.id} id={`comment-${comment.id}`}>
//             <AuthorInfo>
//               <p>{comment.authorName}</p>
//               <p>{new Date(comment.createdAt).toLocaleString()}</p>
//             </AuthorInfo>
//             <CommentContent>
//               {comment.hidden ? (
//                 <HiddenCommentNotice>
//                   NOTICE: 해당 댓글은 삭제되거나 숨김 처리되었습니다.
//                 </HiddenCommentNotice>
//               ) : (
//                 <InlineBlockContainer>
//                   <div>
//                     {isValidJSONContent(comment.contentJSON) ? (
//                       <ReadOnlyEditor contentJSON={comment.contentJSON} />
//                     ) : (
//                       <HtmlContent html={comment.content} />
//                     )}
//                   </div>
//                   {comment.editedByAdmin && (
//                     <AdminEditIndicator>
//                       [관리자에 의해 댓글 내용 수정]
//                     </AdminEditIndicator>
//                   )}
//                 </InlineBlockContainer>
//               )}
//               <ActionButtons>
//                 <div className="left">
//                   <report-button
//                     onClick={() => openModal("reportComment", comment.id, "")}
//                     disabled={comment.hasReported}
//                   >
//                     <FontAwesomeIcon icon={faCircleExclamation} />
//                     {isAdmin &&
//                       comment.reportCount !== null &&
//                       comment.reportCount >= 0 && (
//                         <ReportCountText>{comment.reportCount}</ReportCountText>
//                       )}
//                   </report-button>
//                   {memberId === comment.memberId && !isAdmin && (
//                     <>
//                       {!comment.editedByAdmin ? (
//                         <>
//                           <report-button
//                             onClick={() =>
//                               openModal("deleteComment", comment.id)
//                             }
//                           >
//                             <FontAwesomeIcon icon={faDeleteLeft} />
//                           </report-button>
//                           <report-button
//                             onClick={() =>
//                               openModal(
//                                 "editComment",
//                                 comment.id,
//                                 comment.contentJSON
//                               )
//                             }
//                           >
//                             <FontAwesomeIcon icon={faEdit} />
//                           </report-button>
//                         </>
//                       ) : (
//                         <>
//                           <disabled-button>
//                             <FontAwesomeIcon icon={faDeleteLeft} />
//                           </disabled-button>
//                           <disabled-button>
//                             <FontAwesomeIcon icon={faEdit} />
//                           </disabled-button>
//                         </>
//                       )}
//                     </>
//                   )}
//                   {isAdmin && memberId !== comment.memberId && (
//                     <>
//                       <admin-button
//                         onClick={() => openModal("deleteComment", comment.id)}
//                       >
//                         <FontAwesomeIcon icon={faDeleteLeft} />
//                       </admin-button>
//                       <admin-button
//                         onClick={() =>
//                           openModal(
//                             "editComment",
//                             comment.id,
//                             comment.contentJSON
//                           )
//                         }
//                       >
//                         <FontAwesomeIcon icon={faEdit} />
//                       </admin-button>
//                     </>
//                   )}
//                   {isAdmin && memberId === comment.memberId && (
//                     <>
//                       <admin-button
//                         onClick={() => openModal("deleteComment", comment.id)}
//                       >
//                         <FontAwesomeIcon icon={faDeleteLeft} />
//                       </admin-button>
//                       <admin-button
//                         onClick={() =>
//                           openModal(
//                             "editComment",
//                             comment.id,
//                             comment.contentJSON
//                           )
//                         }
//                       >
//                         <FontAwesomeIcon icon={faEdit} />
//                       </admin-button>
//                     </>
//                   )}
//                 </div>
//                 <div className="right">
//                   <button onClick={() => handleLikeComment(comment.id)}>
//                     <FontAwesomeIcon icon={faThumbsUp} /> {comment.likesCount}
//                   </button>
//                   <button onClick={() => handleReply(comment, "comment")}>
//                     <FontAwesomeIcon icon={faReply} />
//                   </button>
//                   {isAdmin && comment.hidden && (
//                     <button
//                       onClick={() => openModal("restoreComment", comment.id)}
//                       disabled={loadingCommentId === comment.id}
//                     >
//                       {loadingCommentId === comment.id ? (
//                         <FontAwesomeIcon icon={faSpinner} spin />
//                       ) : (
//                         <>
//                           <FontAwesomeIcon icon={faUndo} /> 복원
//                         </>
//                       )}
//                     </button>
//                   )}
//                 </div>
//               </ActionButtons>
//             </CommentContent>
//           </CommentCard>
//         ))}
//       </CommentSection>

//       <hr />

//       <CommentInputSection>
//         <div className="toolbar">
//           <button
//             onClick={() => editor.chain().focus().toggleBold().run()}
//             className={editor.isActive("bold") ? "active" : ""}
//           >
//             <strong>B</strong>
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleItalic().run()}
//             className={editor.isActive("italic") ? "active" : ""}
//           >
//             <em>I</em>
//           </button>
//           <button
//             onClick={() => editor.chain().focus().toggleUnderline().run()}
//             className={editor.isActive("underline") ? "active" : ""}
//           >
//             <u>U</u>
//           </button>
//           <button onClick={handleAddLink}>Link</button>
//           <button
//             onClick={() => editor.chain().focus().unsetLink().run()}
//             disabled={!editor.isActive("link")}
//           >
//             Remove Link
//           </button>
//         </div>
//         {replyingTo && (
//           <div style={{ marginBottom: "5px" }}>
//             <em>인용 중...</em>{" "}
//             <button onClick={resetReplying} style={{ fontSize: "0.8rem" }}>
//               [취소]
//             </button>
//           </div>
//         )}
//         <EditorContent editor={editor} className="editor" />
//         <button onClick={handleAddComment}>댓글 추가</button>
//       </CommentInputSection>

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
