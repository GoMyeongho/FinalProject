import AxiosInstance from "./AxiosInstance";

/**
 * ForumApi.js (Spring Boot Proxy 버전)
 *
 * 각 메서드는 AxiosInstance의 호출을 그대로 반환합니다.
 * try/catch 없이 axios 자체를 리턴하여 API 호출을 단순하게 유지합니다.
 * 호출하는 쪽에서 try/catch를 통해 에러 처리를 진행하면 됩니다.
 */
const ForumApi = {
  // ------------------ 카테고리 관련 ------------------
  fetchCategories: () =>
    AxiosInstance.get("/api/forums/categories").then((response) => {
      console.log("Fetched Categories:", response.data);
      return response.data;
    }),

  getPostsByCategoryId: (categoryId, page = 1, size = 10) => {
    const safePage = page < 1 ? 1 : page;
    return AxiosInstance.get("/api/forums/posts", {
      params: { categoryId, page: safePage, size },
    }).then((response) => response.data);
  },

  getCategoryById: (categoryId) =>
    AxiosInstance.get(`/api/forums/categories/${categoryId}`).then(
      (response) => response.data
    ),

  // ------------------ 게시글(Post) 관련 ------------------
  getPostById: (postId) =>
    AxiosInstance.get(`/api/forums/posts/${postId}`).then(
      (response) => response.data
    ),

  createPostAndFetch: (data) =>
    AxiosInstance.post("/api/forums/posts", data).then((createRes) => {
      const createData = createRes.data;
      return AxiosInstance.get(`/api/forums/posts/${createData.id}`).then(
        (detailRes) => detailRes.data
      );
    }),

  createPost: (data) =>
    AxiosInstance.post("/api/forums/posts", data).then(
      (response) => response.data
    ),

  updatePostTitle: (postId, data, loggedInMemberId, isAdmin) =>
    AxiosInstance.put(
      `/api/forums/posts/${postId}/title?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`,
      data
    ).then((response) => response.data),

  updatePostContent: (postId, data, loggedInMemberId, isAdmin) =>
    AxiosInstance.put(
      `/api/forums/posts/${postId}/content?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`,
      data
    ).then((response) => response.data),

  deletePost: (postId, loggedInMemberId, removedBy, isAdmin) => {
    const url = `/api/forums/posts/${postId}?loggedInMemberId=${loggedInMemberId}&removedBy=${encodeURIComponent(
      removedBy
    )}&isAdmin=${isAdmin}`;
    console.log(`Request URL: ${url}`);
    return AxiosInstance.delete(url);
  },

  hardDeletePost: (postId, loggedInMemberId) =>
    AxiosInstance.delete(
      `/api/forums/posts/${postId}/hard-delete?loggedInMemberId=${loggedInMemberId}`
    ).then((response) => {
      console.log("포럼 게시글 하드 삭제 성공:", response.data);
      return response.data;
    }),

  reportPost: (postId, reporterId, reason) =>
    AxiosInstance.post(`/api/forums/posts/${postId}/report`, {
      reporterId,
      reason,
    }).then((response) => response.data),

  restorePost: (postId) =>
    AxiosInstance.post(`/api/forums/posts/${postId}/restore`).then(
      (response) => response.data
    ),

  toggleLikePost: (postId, loggedInMemberId) =>
    AxiosInstance.post(`/api/forums/posts/${postId}/like`, {
      memberId: loggedInMemberId,
    }).then((response) => response.data),

  // ------------------ 댓글(Comment) 관련 ------------------
  getCommentsByPostId: (postId) =>
    AxiosInstance.get(`/api/forums/comments/${postId}`).then((response) => {
      console.log("Fetched Comments:", response.data);
      return response.data;
    }),

  addComment: (data, token = "") =>
    AxiosInstance.post("/api/forums/comments", data, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((response) => response.data),

  editComment: (commentId, data, loggedInMemberId, isAdmin) =>
    AxiosInstance.put(
      `/api/forums/comments/${commentId}?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`,
      data
    ).then((response) => response.data),

  deleteComment: (commentId, loggedInMemberId, isAdmin) =>
    AxiosInstance.delete(
      `/api/forums/comments/${commentId}?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`
    ).then((response) => response.data),

  hardDeleteComment: (commentId, loggedInMemberId) =>
    AxiosInstance.delete(
      `/api/forums/comments/${commentId}/hard-delete?loggedInMemberId=${loggedInMemberId}`
    ).then((response) => {
      console.log("포럼 댓글 하드 삭제 성공:", response.data);
      return response.data;
    }),

  reportComment: (commentId, reporterId, reason) =>
    AxiosInstance.post(`/api/forums/comments/${commentId}/report`, {
      reporterId,
      reason,
    }).then((response) => response.data),

  restoreComment: (commentId) =>
    AxiosInstance.post(`/api/forums/comments/${commentId}/restore`).then(
      (response) => response.data
    ),

  // 수정된 ForumApi.js의 toggleLikeComment: 이제 postId를 함께 전달합니다.
  toggleLikeComment: (commentId, loggedInMemberId, postId) =>
    AxiosInstance.post(`/api/forums/comments/${commentId}/like`, {
      memberId: loggedInMemberId,
      postId: postId, // 댓글이 속한 게시글의 ID를 함께 보냄
    }).then((response) => response.data),

  // ------------------ 검색 및 상세 조회 ------------------
  search: (q, category, page, size) => {
    const safePage = page < 1 ? 1 : page;
    const encodedQ = encodeURIComponent(q);
    const encodedType = encodeURIComponent("forum_post");
    const categoryParam = category
      ? `&category=${encodeURIComponent(category)}`
      : "";
    const uri = `/api/forums/search?q=${encodedQ}&type=${encodedType}${categoryParam}&page=${safePage}&size=${size}`;
    return AxiosInstance.get(uri).then((response) => response.data);
  },

  detail: (postId) =>
    AxiosInstance.get(`/api/forums/posts/${postId}`).then(
      (response) => response.data
    ),

  incrementViewCount: (postId) =>
    AxiosInstance.post(`/api/forums/posts/${postId}/increment-view`),
};

export default ForumApi;
