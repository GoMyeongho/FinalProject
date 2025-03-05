// import React from "react";
// import {
//   PostHeader,
//   AuthorInfo,
//   ContentInfo,
//   ActionButtons,
//   InlineBlockContainer,
//   HiddenCommentNotice,
//   AdminEditIndicator,
//   ReportCountText,
// } from "../../../styles/PostDetailStyles";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faDeleteLeft,
//   faEdit,
//   faCircleExclamation,
//   faThumbsUp,
//   faReply,
//   faUndo,
//   faSpinner,
// } from "@fortawesome/free-solid-svg-icons";

// import ReadOnlyEditor from "../ReadOnlyEditor";

// /**
//  * Safely parse JSON. Returns `null` if invalid.
//  */
// function parseJSONSafe(jsonString) {
//   try {
//     return JSON.parse(jsonString);
//   } catch (error) {
//     console.warn("Invalid JSON string:", error);
//     return null;
//   }
// }

// /**
//  * Checks if the parsed JSON has the shape TipTap expects:
//  * { "type": "doc", "content": [...] }
//  */
// function isValidJSONContent(json) {
//   if (!json) return false;
//   if (json.type !== "doc") return false;
//   if (!Array.isArray(json.content)) return false;
//   return true;
// }

// /** Renders HTML directly (fallback) */
// const HtmlContent = ({ html }) => (
//   <div dangerouslySetInnerHTML={{ __html: html }} />
// );

// /**
//  * PostBox (without the title).
//  * Just author info (left), body, action buttons (right).
//  */
// const PostBox = ({
//   post,
//   memberId,
//   isAdmin,
//   loading,
//   // callbacks
//   onDeletePost,
//   onEditPostContent,
//   onReportPost,
//   onRestorePost,
//   onLikePost,
//   onReplyPost,
// }) => {
//   if (!post) return null;

//   // 1) Parse the JSON *once*
//   const parsedJSON = parseJSONSafe(post.contentJSON);

//   // 2) Decide which content to render
//   const shouldUseTipTap = isValidJSONContent(parsedJSON);

//   return (
//     <PostHeader style={{ marginBottom: "15px" }}>
//       {/* Left side: author info */}
//       <AuthorInfo>
//         <p>
//           <strong>게시자:</strong> {post.authorName}
//         </p>
//         <p>
//           <strong>생성일:</strong> {new Date(post.createdAt).toLocaleString()}
//         </p>
//       </AuthorInfo>

//       {/* Right side: post body + action buttons */}
//       <ContentInfo style={{ width: "100%" }}>
//         {/* Body */}
//         {post.hidden ? (
//           <HiddenCommentNotice>
//             NOTICE: 해당 게시글은 삭제되거나 숨김 처리되었습니다.
//           </HiddenCommentNotice>
//         ) : (
//           <InlineBlockContainer>
//             <div>
//               {shouldUseTipTap ? (
//                 <ReadOnlyEditor contentJSON={parsedJSON} />
//               ) : (
//                 <HtmlContent html={post.content} />
//               )}
//             </div>
//             {post.editedByAdminContent && (
//               <AdminEditIndicator>
//                 [관리자에 의해 내용 수정됨]
//               </AdminEditIndicator>
//             )}
//           </InlineBlockContainer>
//         )}

//         {/* Action Buttons */}
//         <ActionButtons>
//           <div className="left">
//             <report-button
//               onClick={() => onReportPost(post.id, post.content)}
//               disabled={post.hasReported}
//             >
//               <FontAwesomeIcon icon={faCircleExclamation} />
//               {isAdmin && post.reportCount !== undefined && (
//                 <ReportCountText>{post.reportCount}</ReportCountText>
//               )}
//             </report-button>

//             {/* 작성자 본인 & 관리자수정 안 된 경우 => 삭제/수정 */}
//             {memberId === post.memberId &&
//               !isAdmin &&
//               !post.editedByAdminContent && (
//                 <>
//                   <report-button onClick={() => onDeletePost(post.id)}>
//                     <FontAwesomeIcon icon={faDeleteLeft} />
//                   </report-button>
//                   <report-button
//                     onClick={() => onEditPostContent(post.id, post.contentJSON)}
//                   >
//                     <FontAwesomeIcon icon={faEdit} />
//                   </report-button>
//                 </>
//               )}

//             {/* 관리자 => 무조건 삭제/수정 가능 */}
//             {isAdmin && (
//               <>
//                 <admin-button onClick={() => onDeletePost(post.id)}>
//                   <FontAwesomeIcon icon={faDeleteLeft} />
//                 </admin-button>
//                 <admin-button
//                   onClick={() => onEditPostContent(post.id, post.contentJSON)}
//                 >
//                   <FontAwesomeIcon icon={faEdit} />
//                 </admin-button>
//               </>
//             )}
//           </div>

//           <div className="right">
//             <button onClick={() => onLikePost(post.id)}>
//               <FontAwesomeIcon icon={faThumbsUp} /> {post.likesCount}
//             </button>
//             <button onClick={() => onReplyPost(post, "post")}>
//               <FontAwesomeIcon icon={faReply} />
//             </button>
//             {isAdmin && post.hidden && (
//               <button onClick={() => onRestorePost(post.id)} disabled={loading}>
//                 {loading ? (
//                   <FontAwesomeIcon icon={faSpinner} spin />
//                 ) : (
//                   <>
//                     <FontAwesomeIcon icon={faUndo} /> 복원
//                   </>
//                 )}
//               </button>
//             )}
//           </div>
//         </ActionButtons>
//       </ContentInfo>
//     </PostHeader>
//   );
// };

// export default PostBox;
