// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import ForumApi from "../../api/ForumApi";
// import {
//   PostsContainer,
//   SectionHeader,
//   PostsSection,
//   PostCard,
//   PostTitle,
//   PostDetails,
//   PostMeta,
//   PostRightSection,
//   PostStat,
//   LatestCommentContainer, // ✅ 추가된 스타일
//   StyledLink,
// } from "../../styles/ForumPostsStyles";

// const ForumPosts = () => {
//   const { categoryId } = useParams(); // URL에서 categoryId 가져오기
//   const [posts, setPosts] = useState([]); // 일반 게시글 상태
//   const [stickyPosts, setStickyPosts] = useState([]); // 고정 게시글 상태
//   const [loading, setLoading] = useState(true); // 로딩 상태 관리
//   const [categoryName, setCategoryName] = useState(""); // 카테고리 이름 상태

//   const stripHtmlTags = (html) => {
//     const div = document.createElement("div");
//     div.innerHTML = html;
//     return div.textContent || div.innerText || "";
//   };

//   /**
//    * API 호출: 특정 카테고리의 게시글 및 카테고리 정보 가져오기
//    */
//   const fetchPosts = async () => {
//     try {
//       const { data } = await ForumApi.getPostsByCategoryId(categoryId, 0, 10);

//       // ✅ Ensure `latestComment` is included in posts
//       const processedPosts = data.map((post) => ({
//         ...post,
//         latestComment: post.latestComment || null, // 기본값 설정 (방어적 코드)
//       }));

//       setStickyPosts(processedPosts.filter((post) => post.sticky)); // ✅ 고정 게시글 필터링 유지
//       setPosts(processedPosts.filter((post) => !post.sticky)); // 일반 게시글 필터링
//       const category = await ForumApi.getCategoryById(categoryId);
//       setCategoryName(category.name);
//     } catch (error) {
//       console.error("게시글 데이터를 가져오는데 실패했습니다.", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPosts(); // 컴포넌트 로드 시 또는 categoryId 변경 시 데이터 새로고침
//   }, [categoryId]);

//   if (loading) return <div>로딩 중...</div>;

//   return (
//     <PostsContainer>
//       <SectionHeader>{categoryName}</SectionHeader>

//       {/* ✅ 고정 게시글 섹션 추가 */}
//       {stickyPosts.length > 0 && (
//         <PostsSection>
//           <h3>고정 게시글</h3>
//           {stickyPosts.map((post) => (
//             <StyledLink
//               to={`/forum/post/${post.id}`}
//               key={post.id}
//               onClick={() => ForumApi.incrementViewCount(post.id)}
//             >
//               <PostCard>
//                 <div>
//                   <PostTitle>{post.title}</PostTitle>
//                   <PostMeta>
//                     작성일: {new Date(post.createdAt).toLocaleDateString()}
//                   </PostMeta>
//                   <PostDetails>작성자: {post.authorName}</PostDetails>
//                 </div>
//                 <PostRightSection>
//                   <PostStat>조회수: {post.viewsCount}</PostStat>
//                   <PostStat>좋아요: {post.likesCount}</PostStat>

//                   {/* ✅ 최신 댓글을 깔끔한 UI로 표시 */}
//                   <LatestCommentContainer>
//                     {post.latestComment && post.latestComment.content ? (
//                       <>
//                         <span className="comment-author">
//                           {post.latestComment.authorName}
//                         </span>
//                         ,{" "}
//                         <span className="comment-date">
//                           {new Date(
//                             post.latestComment.createdAt
//                           ).toLocaleDateString()}
//                         </span>{" "}
//                         - "
//                         <span className="comment-preview">
//                           {post.latestComment.content.substring(0, 20)}
//                         </span>
//                         ..."
//                       </>
//                     ) : (
//                       <span className="no-comment">No comments</span>
//                     )}
//                   </LatestCommentContainer>
//                 </PostRightSection>
//               </PostCard>
//             </StyledLink>
//           ))}
//         </PostsSection>
//       )}

//       {/* 일반 게시글 섹션 */}
//       {posts.length > 0 ? (
//         <PostsSection>
//           <h3>일반 게시글</h3>
//           {posts.map((post) => (
//             <StyledLink
//               to={`/forum/post/${post.id}`}
//               key={post.id}
//               onClick={() => ForumApi.incrementViewCount(post.id)}
//             >
//               <PostCard>
//                 <div>
//                   <PostTitle>{post.title}</PostTitle>
//                   <PostMeta>
//                     작성일: {new Date(post.createdAt).toLocaleDateString()}
//                   </PostMeta>
//                   <PostDetails>작성자: {post.authorName}</PostDetails>
//                 </div>
//                 <PostRightSection>
//                   <PostStat>조회수: {post.viewsCount}</PostStat>
//                   <PostStat>좋아요: {post.likesCount}</PostStat>

//                   {/* ✅ 최신 댓글을 깔끔한 UI로 표시 */}
//                   <LatestCommentContainer>
//                     {post.latestComment && post.latestComment.content ? (
//                       <>
//                         <span className="comment-author">
//                           {post.latestComment.authorName}
//                         </span>
//                         ,{" "}
//                         <span className="comment-date">
//                           {new Date(
//                             post.latestComment.createdAt
//                           ).toLocaleDateString()}
//                         </span>{" "}
//                         - "
//                         <span className="comment-preview">
//                           {stripHtmlTags(post.latestComment.content).substring(
//                             0,
//                             20
//                           )}
//                         </span>
//                         ..."
//                       </>
//                     ) : (
//                       <span className="no-comment">No comments</span>
//                     )}
//                   </LatestCommentContainer>
//                 </PostRightSection>
//               </PostCard>
//             </StyledLink>
//           ))}
//         </PostsSection>
//       ) : (
//         <p>아직 이 카테고리에는 게시글이 존재하지 않습니다.</p>
//       )}
//     </PostsContainer>
//   );
// };

// export default ForumPosts;
