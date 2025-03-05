// import React from "react";
// import {
//   CommentSection,
//   CommentCard,
//   AuthorInfo,
//   CommentContent,
//   InlineBlockContainer,
//   AdminEditIndicator,
//   HiddenCommentNotice,
//   ReportCountText,
//   ActionButtons,
// } from "../../../styles/PostDetailStyles";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faDeleteLeft,
//   faEdit,
//   faCircleExclamation,
//   faThumbsUp,
//   faReply,
//   faSpinner,
//   faUndo,
//   faTrash,
// } from "@fortawesome/free-solid-svg-icons";
// import ReadOnlyEditor from "../ReadOnlyEditor";

// const CommentList = ({
//   comments,
//   memberId,
//   isAdmin,
//   onDeleteComment,
//   onHardDeleteComment,
//   onEditComment,
//   onReportComment,
//   onRestoreComment,
//   onLikeComment,
//   onReply,
// }) => {
//   // 기존 onJumpTo 핸들러 제거 (원본 링크 기능 사용하지 않으므로)
//   return (
//     <CommentSection>
//       <h2>댓글</h2>
//       {comments.map((comment) => (
//         <CommentCard key={comment.id} id={`comment-${comment.id}`}>
//           <AuthorInfo>
//             <p>{comment.authorName}</p>
//             <p>{new Date(comment.createdAt).toLocaleString()}</p>
//           </AuthorInfo>
//           <CommentContent>
//             {comment.hidden ? (
//               <HiddenCommentNotice>
//                 NOTICE: 해당 댓글은 삭제되거나 숨김 처리되었습니다.
//               </HiddenCommentNotice>
//             ) : (
//               <InlineBlockContainer>
//                 <div>
//                   {comment.contentJSON && comment.contentJSON.type === "doc" ? (
//                     // sourceId prop 제거 – 원본 링크 기능 없음
//                     <ReadOnlyEditor contentJSON={comment.contentJSON} />
//                   ) : (
//                     <div
//                       dangerouslySetInnerHTML={{ __html: comment.content }}
//                     />
//                   )}
//                 </div>
//                 {comment.editedByAdmin && (
//                   <AdminEditIndicator>
//                     [관리자에 의해 댓글 내용 수정]
//                   </AdminEditIndicator>
//                 )}
//               </InlineBlockContainer>
//             )}
//             <ActionButtons>
//               <div className="left">
//                 <report-button
//                   onClick={() => onReportComment(comment.id, "")}
//                   disabled={comment.hasReported}
//                 >
//                   <FontAwesomeIcon icon={faCircleExclamation} />
//                   {isAdmin &&
//                     comment.reportCount !== null &&
//                     comment.reportCount >= 0 && (
//                       <ReportCountText>{comment.reportCount}</ReportCountText>
//                     )}
//                 </report-button>
//                 {memberId === comment.memberId &&
//                 !isAdmin &&
//                 !comment.editedByAdmin ? (
//                   <>
//                     <report-button onClick={() => onDeleteComment(comment.id)}>
//                       <FontAwesomeIcon icon={faDeleteLeft} />
//                     </report-button>
//                     <report-button
//                       onClick={() =>
//                         onEditComment(comment.id, comment.contentJSON)
//                       }
//                     >
//                       <FontAwesomeIcon icon={faEdit} />
//                     </report-button>
//                   </>
//                 ) : null}
//                 {isAdmin && (
//                   <>
//                     <admin-button onClick={() => onDeleteComment(comment.id)}>
//                       <FontAwesomeIcon icon={faDeleteLeft} />
//                     </admin-button>
//                     <admin-button
//                       onClick={() =>
//                         onEditComment(comment.id, comment.contentJSON)
//                       }
//                     >
//                       <FontAwesomeIcon icon={faEdit} />
//                     </admin-button>
//                   </>
//                 )}
//               </div>
//               <div className="right">
//                 <button onClick={() => onLikeComment(comment.id)}>
//                   <FontAwesomeIcon icon={faThumbsUp} /> {comment.likesCount}
//                 </button>
//                 <button onClick={() => onReply(comment, "comment")}>
//                   <FontAwesomeIcon icon={faReply} />
//                 </button>
//                 {isAdmin && comment.hidden && (
//                   <button onClick={() => onRestoreComment(comment.id)}>
//                     <FontAwesomeIcon icon={faUndo} /> 복원
//                   </button>
//                 )}
//               </div>
//             </ActionButtons>
//           </CommentContent>
//         </CommentCard>
//       ))}
//     </CommentSection>
//   );
// };

// export default CommentList;
