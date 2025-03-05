import AxiosInstance from "./AxiosInstance";

/**
 * 포럼 관련 API 관리
 * KR: 새 백엔드 컨트롤러에 맞게 엔드포인트를 리팩토링했습니다.
 */
const ForumApi = {
  /**
   * 모든 포럼 카테고리 가져오기
   * KR: 백엔드의 /forum/category 엔드포인트를 호출합니다.
   * @returns {Promise<Object[]>} 카테고리 목록 반환
   */
  fetchCategories: async () => {
    try {
      const response = await AxiosInstance.get("/forum/category");
      console.log("Fetched Categories:", response.data);
      return response.data;
    } catch (error) {
      console.error("포럼 카테고리 가져오기 중 오류:", error);
      throw error;
    }
  },

  /**
   * 특정 포럼 게시글 상세 정보 가져오기
   * KR: /forum/post/{postId} 엔드포인트를 호출합니다.
   * @param {number} postId - 포럼 게시글 ID
   * @returns {Promise<Object>} 게시글 상세 데이터 반환
   */
  getPostById: async (postId) => {
    try {
      const response = await AxiosInstance.get(`/forum/post/${postId}`);
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 상세 조회 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 생성
   * KR: /forum/post 엔드포인트로 새 게시글 데이터를 전송합니다.
   * @param {Object} data - 게시글 생성 데이터 (제목, 내용, 카테고리 등)
   * @returns {Promise<Object>} 생성된 게시글 데이터 반환
   */
  createPost: async (data) => {
    try {
      const response = await AxiosInstance.post("/forum/post", data);
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 생성 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 제목 수정
   * KR: /forum/post/{postId}/title 엔드포인트를 호출합니다.
   * @param {number} postId - 수정할 게시글 ID
   * @param {Object} data - 수정 요청 데이터 (새 제목 포함)
   * @param {number} loggedInMemberId - 로그인된 사용자 ID
   * @param {boolean} isAdmin - 관리자 여부
   * @returns {Promise<Object>} 수정된 게시글 데이터 반환
   */
  updatePostTitle: async (postId, data, loggedInMemberId, isAdmin) => {
    try {
      const response = await AxiosInstance.put(
        `/forum/post/${postId}/title?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 제목 수정 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 내용 수정 (TipTap JSON 전용)
   * KR: /forum/post/{postId}/content 엔드포인트를 호출합니다.
   * @param {number} postId - 수정할 게시글 ID
   * @param {Object} data - 수정 요청 데이터 (contentJSON 포함)
   * @param {number} loggedInMemberId - 로그인된 사용자 ID
   * @param {boolean} isAdmin - 관리자 여부
   * @returns {Promise<Object>} 수정된 게시글 데이터 반환
   */
  updatePostContent: async (postId, data, loggedInMemberId, isAdmin) => {
    try {
      const response = await AxiosInstance.put(
        `/forum/post/${postId}/content?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 내용 수정 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 삭제 (논리 삭제)
   * KR: /forum/post/{postId} 엔드포인트를 DELETE 메서드로 호출합니다.
   * @param {number} postId - 삭제할 게시글 ID
   * @param {number} loggedInMemberId - 로그인된 사용자 ID
   * @param {string} removedBy - 삭제 수행자 (작성자 이름 또는 ADMIN)
   * @param {boolean} isAdmin - 관리자 여부
   * @returns {Promise<void>}
   */
  deletePost: async (postId, loggedInMemberId, removedBy, isAdmin) => {
    try {
      const url = `/forum/post/${postId}?loggedInMemberId=${loggedInMemberId}&removedBy=${encodeURIComponent(
        removedBy
      )}&isAdmin=${isAdmin}`;
      console.log(`Request URL: ${url}`);
      await AxiosInstance.delete(url);
    } catch (error) {
      console.error("포럼 게시글 삭제 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 하드 삭제 (관리자 전용)
   * KR: /forum/post/{postId}/hard-delete 엔드포인트를 호출합니다.
   * @param {number} postId - 하드 삭제할 게시글 ID
   * @param {number} loggedInMemberId - 로그인된 관리자 ID
   * @returns {Promise<Object>} 삭제 결과 반환
   */
  hardDeletePost: async (postId, loggedInMemberId) => {
    try {
      const response = await AxiosInstance.delete(
        `/forum/post/${postId}/hard-delete?loggedInMemberId=${loggedInMemberId}`
      );
      console.log("포럼 게시글 하드 삭제 성공:", response.data);
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 하드 삭제 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 신고 처리
   * KR: /forum/post/{postId}/report 엔드포인트를 호출하여 신고를 처리합니다.
   * @param {number} postId - 신고할 게시글 ID
   * @param {number} reporterId - 신고자 ID
   * @param {string} reason - 신고 사유
   * @returns {Promise<Object>} 신고 처리 결과 반환
   */
  reportPost: async (postId, reporterId, reason) => {
    try {
      const response = await AxiosInstance.post(
        `/forum/post/${postId}/report`,
        { reason },
        { params: { reporterId } }
      );
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 신고 중 오류:", error);
      throw error;
    }
  },

  /**
   * 포럼 게시글 복원
   * KR: /forum/post/{postId}/restore 엔드포인트를 호출하여 삭제된 게시글을 복원합니다.
   * @param {number} postId - 복원할 게시글 ID
   * @returns {Promise<Object>} 복원된 게시글 데이터 반환
   */
  restorePost: async (postId) => {
    try {
      const response = await AxiosInstance.post(
        `/forum/post/${postId}/restore`
      );
      return response.data;
    } catch (error) {
      console.error("포럼 게시글 복원 중 오류:", error);
      throw error;
    }
  },

  /**
   * 특정 게시글의 댓글 가져오기
   * KR: /forum/comments 엔드포인트에 postId 쿼리 파라미터를 전달하여 댓글 목록을 조회합니다.
   * @param {number} postId - 게시글 ID
   * @returns {Promise<Object[]>} 댓글 배열 반환
   */
  getCommentsByPostId: async (postId) => {
    try {
      const response = await AxiosInstance.get("/forum/comments", {
        params: { postId },
      });
      console.log("Fetched Comments:", response.data);
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 조회 중 오류:", error);
      throw error;
    }
  },

  /**
   * 댓글 생성 (포럼)
   * KR: /forum/comment 엔드포인트를 호출하여 댓글 데이터를 생성합니다.
   * @param {Object} data - 댓글 생성 데이터 (postId, memberId, content 등)
   * @param {string} token - 사용자 액세스 토큰 (Authorization 헤더 사용)
   * @returns {Promise<Object>} 생성된 댓글 데이터 반환
   */
  addComment: async (data, token) => {
    try {
      const response = await AxiosInstance.post("/forum/comment", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 생성 중 오류:", error);
      throw error;
    }
  },

  /**
   * 댓글 수정 (포럼)
   * KR: /forum/comment/{commentId} 엔드포인트를 호출하여 댓글을 수정합니다.
   * @param {number} commentId - 수정할 댓글 ID
   * @param {Object} data - 수정 데이터 (content, contentJSON 등)
   * @param {number} loggedInMemberId - 로그인된 사용자 ID
   * @param {boolean} isAdmin - 관리자 여부
   * @returns {Promise<Object>} 수정된 댓글 데이터 반환
   */
  editComment: async (commentId, data, loggedInMemberId, isAdmin) => {
    try {
      if (!loggedInMemberId) {
        throw new Error("로그인된 사용자 ID가 필요합니다.");
      }
      const response = await AxiosInstance.put(
        `/forum/comment/${commentId}?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 수정 중 오류:", error);
      throw error;
    }
  },

  /**
   * 특정 댓글에 대한 답글 (인용) 추가
   * KR: 부모 댓글에 대한 답글을 생성하기 위해, 백엔드의 /api/forums/comments/{commentId}/reply 엔드포인트를 호출합니다.
   *
   * @param {number} commentId - 부모 댓글 ID
   * @param {Object} data - 답글 데이터 (내용 등)
   * @param {string} token - 사용자 액세스 토큰 (Authorization 헤더 사용)
   * @returns {Promise<Object>} 서버 응답 데이터 (생성된 답글 정보)
   */
  replyToComment: async (commentId, data, token) => {
    try {
      const response = await AxiosInstance.post(
        `/api/forums/comments/${commentId}/reply`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error("답글 추가 중 오류 발생:", error);
      throw error;
    }
  },

  /**
   * 댓글 삭제 (포럼, 논리 삭제)
   * KR: /forum/comment/{commentId} 엔드포인트를 DELETE 메서드로 호출합니다.
   * @param {number} commentId - 삭제할 댓글 ID
   * @param {number} loggedInMemberId - 로그인된 사용자 ID
   * @param {boolean} isAdmin - 관리자 여부
   * @returns {Promise<Object>} 삭제 결과 반환
   */
  deleteComment: async (commentId, loggedInMemberId, isAdmin) => {
    if (!loggedInMemberId) {
      throw new Error("로그인된 사용자 ID가 필요합니다.");
    }
    try {
      const response = await AxiosInstance.delete(
        `/forum/comment/${commentId}?loggedInMemberId=${loggedInMemberId}&isAdmin=${isAdmin}`
      );
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 삭제 중 오류:", error);
      throw error;
    }
  },

  /**
   * 댓글 하드 삭제 (포럼, 관리자 전용)
   * KR: /forum/comment/{commentId}/hard-delete 엔드포인트를 DELETE 메서드로 호출합니다.
   * @param {number} commentId - 하드 삭제할 댓글 ID
   * @param {number} loggedInMemberId - 로그인된 관리자 ID
   * @returns {Promise<Object>} 삭제 결과 반환
   */
  hardDeleteComment: async (commentId, loggedInMemberId) => {
    try {
      const response = await AxiosInstance.delete(
        `/forum/comment/${commentId}/hard-delete?loggedInMemberId=${loggedInMemberId}`
      );
      console.log("포럼 댓글 하드 삭제 성공:", response.data);
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 하드 삭제 중 오류:", error);
      throw error;
    }
  },

  /**
   * 댓글 신고 (포럼)
   * KR: /forum/comment/{commentId}/report 엔드포인트를 호출하여 댓글 신고를 처리합니다.
   * @param {number} commentId - 신고 대상 댓글 ID
   * @param {number} reporterId - 신고자 ID
   * @param {string} reason - 신고 사유
   * @returns {Promise<Object>} 신고 처리 결과 반환
   */
  reportComment: async (commentId, reporterId, reason) => {
    try {
      const response = await AxiosInstance.post(
        `/forum/comment/${commentId}/report`,
        { reason },
        { params: { reporterId } }
      );
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 신고 중 오류:", error);
      throw error;
    }
  },

  /**
   * 댓글 복원 (포럼)
   * KR: /forum/comment/{commentId}/restore 엔드포인트를 호출하여 삭제된 댓글을 복원합니다.
   * @param {number} commentId - 복원할 댓글 ID
   * @returns {Promise<Object>} 복원된 댓글 데이터 반환
   */
  restoreComment: async (commentId) => {
    try {
      const response = await AxiosInstance.post(
        `/forum/comment/${commentId}/restore`
      );
      return response.data;
    } catch (error) {
      console.error("포럼 댓글 복원 중 오류:", error);
      throw error;
    }
  },
};

export default ForumApi;
