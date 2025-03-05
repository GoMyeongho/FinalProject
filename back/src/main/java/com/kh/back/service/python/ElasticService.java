package com.kh.back.service.python;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kh.back.dto.forum.request.ForumPostRequestDto;
import com.kh.back.dto.forum.request.ForumPostCommentRequestDto;
import com.kh.back.dto.forum.response.ForumCategoryDto;
import com.kh.back.dto.forum.response.ForumPostLikeResponseDto;
import com.kh.back.dto.forum.response.ForumPostResponseDto;
import com.kh.back.dto.forum.response.ForumPostCommentResponseDto;
import com.kh.back.dto.python.SearchListResDto;
import com.kh.back.dto.python.SearchResDto;
import com.kh.back.dto.recipe.res.CocktailIngListResDto;
import com.kh.back.dto.recipe.res.CocktailListResDto;
import com.kh.back.dto.recipe.res.CocktailResDto;
import com.kh.back.dto.recipe.res.FoodListResDto;
import com.kh.back.dto.recipe.res.FoodResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ElasticService {

	private final RestTemplate restTemplate;
	private final String flaskBaseUrl = "http://localhost:5001";
	private final ObjectMapper objectMapper;

	/**
	 * [오버로드 메서드: 기존 칵테일 검색용]
	 * - 칵테일 로직처럼 '조리방법(cookingMethod)'이 필요 없는 경우를 위해
	 * - 예전 방식대로 5개 파라미터만 받는 메서드를 추가하여 하위 호환성을 유지
	 * - 내부적으로는 6개 파라미터를 받는 메서드를 호출하며, cookingMethod=""로 처리
	 *
	 * @param q        검색어 (빈 문자열이면 전체 검색)
	 * @param type     검색 타입 (예: "cocktail", "food")
	 * @param category 카테고리 (빈 문자열이면 필터 없음)
	 * @param page     페이지 번호
	 * @param size     페이지 당 항목 수
	 * @return 검색 결과 목록 (SearchListResDto)
	 */
	public List<SearchListResDto> search(String q, String type, String category, Integer page, Integer size) {
		// cookingMethod를 ""(빈 문자열)로 지정하여 6개짜리 메서드를 호출
		return search(q, type, category, "", page, size);
	}

	/**
	 * [신규 메서드: 음식 검색 포함]
	 * - 기존 칵테일 검색뿐만 아니라, 음식 검색 시 '조리방법(cookingMethod)' 필터도 가능
	 * - 호출부에서 cookingMethod가 필요 없는 경우에는 ""로 넘겨주면 됨
	 *
	 * @param q             검색어 (빈 문자열일 경우 전체 검색)
	 * @param type          검색 타입 (예: "cocktail", "food")
	 * @param category      카테고리 (예: "반찬", 없으면 "")
	 * @param cookingMethod 조리방법 (예: "찌기", 없으면 "")
	 * @param page          페이지 번호
	 * @param size          한 페이지 당 항목 수
	 * @return 검색 결과 목록 (SearchListResDto)
	 */
	public List<SearchListResDto> search(String q, String type, String category, String cookingMethod, Integer page, Integer size) {
		try {
			// UTF-8 인코딩 처리
			String encodedQuery = URLEncoder.encode(q, StandardCharsets.UTF_8);
			String encodedType = URLEncoder.encode(type, StandardCharsets.UTF_8);

			// category가 빈 문자열이 아니면 &category=... 파라미터로 추가
			String categoryParam = (category != null && !category.isEmpty())
					? "&category=" + URLEncoder.encode(category, StandardCharsets.UTF_8)
					: "";

			// cookingMethod가 빈 문자열이 아니면 &cookingMethod=... 파라미터로 추가
			String methodParam = (cookingMethod != null && !cookingMethod.isEmpty())
					? "&cookingMethod=" + URLEncoder.encode(cookingMethod, StandardCharsets.UTF_8)
					: "";

			// 최종적으로 호출할 URI 구성
			URI uri = new URI(flaskBaseUrl + "/search?q=" + encodedQuery
					+ "&type=" + encodedType
					+ categoryParam
					+ methodParam
					+ "&page=" + page
					+ "&size=" + size);

			// 로그 기록
			log.info("**[DEBUG]** search() about to call Flask with URI: {}", uri);
			log.info("**[DEBUG]** (q={}, type={}, category={}, cookingMethod={}, page={}, size={})",
					q, type, category, cookingMethod, page, size);

			// Flask 백엔드 호출
			ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
			log.warn("검색의 flask 응답 : {}", response);

			// 응답 JSON 문자열을 List<DTO>로 변환
			return convertResToList(response.getBody(), type);

		} catch (Exception e) {
			log.error("일반 검색중 에러 {}-{}-{}-{}-{} : {}", q, type, category, page, size, e.getMessage());
			return null;
		}
	}

	/**
	 * [상세 조회 메서드]
	 * - 기존과 동일한 로직
	 */
	public SearchResDto detail(String id, String type) {
		try {
			URI uri = new URI(flaskBaseUrl + "/detail/" + id + "?type=" + type);
			log.info("**[DEBUG]** detail() about to call Flask with URI: {}", uri);

			ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
			log.warn("상세정보의 flask 응답 : {}", response);
			return convertResToDto(response.getBody(), type);
		} catch (Exception e) {
			log.error("세부 사항 조회중 에러 {}-{} : {}", id, type, e.getMessage());
			return null;
		}
	}

	/**
	 * [검색 결과 변환 메서드]
	 * - JSON 응답 문자열을 List 형태로 변환
	 * - type이 "cocktail"이면 칵테일 전용 DTO,
	 *   type이 "food"이면 음식 전용 DTO로 매핑,
	 *   그리고 신규로 "forum" 타입에 대해 ForumPostResponseDto로 매핑합니다.
	 */
	public List<SearchListResDto> convertResToList(String response, String type) throws IOException {
		switch (type) {
			case "cocktail":
				return objectMapper.readValue(response,
						objectMapper.getTypeFactory().constructCollectionType(List.class, CocktailListResDto.class));
			case "food":
				return objectMapper.readValue(response,
						objectMapper.getTypeFactory().constructCollectionType(List.class, FoodListResDto.class));
			case "cocktail_ingredient":
				return objectMapper.readValue(response,
						objectMapper.getTypeFactory().constructCollectionType(List.class, CocktailIngListResDto.class));
			case "food_ingredient":
				// 필요 시 FoodIngredient DTO 생성 후 사용 가능
				return null;
			case "forum":
				// 신규: 포럼 검색 결과는 ForumPostResponseDto로 변환
				return objectMapper.readValue(response,
						objectMapper.getTypeFactory().constructCollectionType(List.class, ForumPostResponseDto.class));
			case "feed":
				return null;
			default:
				return null;
		}
	}

	/**
	 * [상세 정보 변환 메서드]
	 * - JSON 응답 문자열을 DTO 형태로 변환
	 */
	public SearchResDto convertResToDto(String response, String type) throws IOException {
		switch (type) {
			case "cocktail":
				return objectMapper.readValue(response, CocktailResDto.class);
			case "food":
				return objectMapper.readValue(response, FoodResDto.class);
			case "forum":
				// 신규: 포럼 상세 정보는 ForumPostResponseDto로 변환
				return objectMapper.readValue(response, ForumPostResponseDto.class);
			case "feed":
				return null;
			default:
				return null;
		}
	}

	/**
	 * [게시글 생성 메서드]
	 * KR: Flask의 /forum/post 엔드포인트를 호출하여 새로운 포럼 게시글을 생성합니다.
	 *     requestDto를 JSON으로 직렬화하여 POST 요청을 보내고, 응답을 ForumPostResponseDto로 역직렬화합니다.
	 *
	 * @param requestDto 게시글 생성 요청 DTO
	 * @return 생성된 ForumPostResponseDto
	 */
	public ForumPostResponseDto createPost(ForumPostRequestDto requestDto) {
		try {
			// /forum/post 엔드포인트 URI 구성
			URI uri = new URI(flaskBaseUrl + "/forum/post");
			// requestDto를 JSON 문자열로 변환 (ObjectMapper 사용)
			String jsonBody = objectMapper.writeValueAsString(requestDto);
			// HttpEntity에 JSON 본문을 담아 POST 요청 준비
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			// Flask 백엔드에 POST 요청 전송
			ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
			log.info("createForumPost response: {}", response);
			// 응답 JSON 문자열을 ForumPostResponseDto로 변환하여 반환
			return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
		} catch (Exception e) {
			log.error("Error creating forum post: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [게시글 제목 수정 메서드]
	 * KR: Flask의 /forum/post/{postId}/title 엔드포인트를 호출하여 게시글 제목을 수정합니다.
	 *
	 * @param postId   수정할 게시글 ID
	 * @param newTitle 새 제목
	 * @param editedBy 수정자 정보 ("ADMIN" 또는 사용자 이름)
	 * @return 수정된 ForumPostResponseDto
	 */
	public ForumPostResponseDto updatePostTitle(Integer postId, String newTitle, String editedBy) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/title");
			// Build JSON body
			String jsonBody = String.format("{\"title\": \"%s\", \"editedBy\": \"%s\"}",
					newTitle, editedBy);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.PUT, entity, String.class);
			log.info("updatePostTitle response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
		} catch (Exception e) {
			log.error("Error updating post title: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [게시글 내용 수정 메서드]
	 * KR: Flask의 /forum/post/{postId}/content 엔드포인트를 호출하여 contentJSON 필드를 업데이트합니다.
	 *
	 * @param postId     수정할 게시글 ID
	 * @param contentJSON 새로운 TipTap JSON 내용
	 * @param editedBy   수정자 정보 ("ADMIN" 또는 사용자 이름)
	 * @param isAdmin    관리자 여부
	 * @return 수정된 ForumPostResponseDto
	 */
	public ForumPostResponseDto updatePostContent(Integer postId, String contentJSON, String editedBy, boolean isAdmin) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/content");
			String jsonBody = String.format("{\"contentJSON\": \"%s\", \"editedBy\": \"%s\", \"isAdmin\": %s}",
					contentJSON, editedBy, isAdmin);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.PUT, entity, String.class);
			log.info("updatePostContent response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
		} catch (Exception e) {
			log.error("Error updating post content: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [게시글 삭제 (소프트 삭제) 메서드]
	 * KR: Flask의 /forum/post/{postId} DELETE 엔드포인트를 호출하여 게시글을 논리 삭제합니다.
	 *
	 * @param postId    삭제할 게시글 ID
	 * @param removedBy 삭제 수행자 정보 ("ADMIN" 또는 사용자 이름)
	 */
	public void deletePost(Integer postId, String removedBy) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "?removedBy=" + URLEncoder.encode(removedBy, StandardCharsets.UTF_8));
			restTemplate.delete(uri);
			log.info("deletePost called for post ID: {}", postId);
		} catch (Exception e) {
			log.error("Error deleting post: {}", e.getMessage());
		}
	}

	/**
	 * [게시글 하드 삭제 메서드]
	 * KR: 관리자 전용으로 Flask의 /forum/post/{postId}/hard-delete 엔드포인트를 호출하여 게시글을 완전 삭제합니다.
	 *
	 * @param postId 삭제할 게시글 ID
	 */
	public void hardDeletePost(Integer postId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/hard-delete");
			restTemplate.delete(uri);
			log.info("hardDeletePost called for post ID: {}", postId);
		} catch (Exception e) {
			log.error("Error in hardDeletePost: {}", e.getMessage());
		}
	}

	/**
	 * [게시글 신고 처리 메서드]
	 * KR: Flask의 /forum/post/{postId}/report 엔드포인트를 호출하여 게시글 신고를 처리합니다.
	 *
	 * @param postId    신고할 게시글 ID
	 * @param reporterId 신고자 ID
	 * @param reason    신고 사유
	 * @return 업데이트된 ForumPostResponseDto
	 */
	public ForumPostResponseDto reportPost(Integer postId, Integer reporterId, String reason) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/report");
			String jsonBody = String.format("{\"reporterId\": %d, \"reason\": \"%s\"}", reporterId, reason);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.POST, entity, String.class);
			log.info("reportPost response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
		} catch (Exception e) {
			log.error("Error reporting post: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [게시글 숨김 처리 메서드]
	 * KR: Flask의 /forum/post/{postId}/hide 엔드포인트를 호출하여 게시글을 숨김 처리합니다.
	 *
	 * @param postId 숨길 게시글 ID
	 */
	public void hidePost(Integer postId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/hide");
			restTemplate.postForEntity(uri, null, String.class);
			log.info("hidePost called for post ID: {}", postId);
		} catch (Exception e) {
			log.error("Error hiding post: {}", e.getMessage());
		}
	}

	/**
	 * [게시글 복구 메서드]
	 * KR: Flask의 /forum/post/{postId}/restore 엔드포인트를 호출하여 삭제된 게시글을 복구합니다.
	 *
	 * @param postId 복구할 게시글 ID
	 */
	public void restorePost(Integer postId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/restore");
			restTemplate.postForEntity(uri, null, String.class);
			log.info("restorePost called for post ID: {}", postId);
		} catch (Exception e) {
			log.error("Error restoring post: {}", e.getMessage());
		}
	}

	/**
	 * [게시글 조회수 증가 메서드]
	 * KR: Flask의 /forum/post/{postId}/increment-view 엔드포인트를 호출하여 게시글 조회수를 증가시킵니다.
	 *
	 * @param postId 게시글 ID
	 */
	public void incrementViewCount(Integer postId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/increment-view");
			restTemplate.postForEntity(uri, null, String.class);
			log.info("incrementViewCount called for post ID: {}", postId);
		} catch (Exception e) {
			log.error("Error incrementing view count: {}", e.getMessage());
		}
	}

    /* =============================================
       댓글 관련 메서드 (새롭게 추가된 부분)
       =============================================
    */

	/**
	 * [댓글 생성 메서드]
	 * KR: Flask의 /forum/comment 엔드포인트를 호출하여 새로운 댓글을 생성합니다.
	 *
	 * @param requestDto 댓글 생성 요청 DTO
	 * @return 생성된 ForumPostCommentResponseDto
	 */
	public ForumPostCommentResponseDto createComment(ForumPostCommentRequestDto requestDto) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment");
			String jsonBody = objectMapper.writeValueAsString(requestDto);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
			log.info("createComment response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
		} catch (Exception e) {
			log.error("Error creating comment: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [댓글 수정 메서드]
	 * KR: Flask의 /forum/comment/{commentId}/content 엔드포인트를 호출하여 댓글의 TipTap JSON 콘텐츠를 업데이트합니다.
	 *
	 * @param commentId  수정할 댓글 ID
	 * @param requestDto 댓글 수정 요청 DTO (TipTap JSON 포함)
	 * @param editedBy   수정자 정보 ("ADMIN" 또는 사용자 ID 문자열)
	 * @param isAdmin    관리자 여부
	 * @return 수정된 ForumPostCommentResponseDto
	 */
	public ForumPostCommentResponseDto updateComment(Integer commentId, ForumPostCommentRequestDto requestDto, String editedBy, boolean isAdmin) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/content");
			String jsonBody = String.format("{\"contentJSON\": \"%s\", \"editedBy\": \"%s\", \"isAdmin\": %s}",
					requestDto.getContentJSON(), editedBy, isAdmin);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.PUT, entity, String.class);
			log.info("updateComment response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
		} catch (Exception e) {
			log.error("Error updating comment: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [특정 게시글에 대한 댓글 검색]
	 * KR: Flask의 /forum/post/{postId}/comments 엔드포인트를 호출하여 댓글 목록을 가져옵니다.
	 *
	 * @param postId 게시글 ID
	 * @return 댓글 목록 (ForumPostCommentResponseDto 리스트)
	 */
	public List<ForumPostCommentResponseDto> searchCommentsForPost(Integer postId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/comments");
			ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
			log.info("searchCommentsForPost response: {}", response);
			return objectMapper.readValue(response.getBody(),
					objectMapper.getTypeFactory().constructCollectionType(List.class, ForumPostCommentResponseDto.class));
		} catch (Exception e) {
			log.error("Error searching comments for post: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [댓글 삭제 (소프트 삭제) 메서드]
	 * KR: Flask의 /forum/comment/{commentId} DELETE 엔드포인트를 호출하여 댓글을 논리 삭제합니다.
	 *
	 * @param commentId 삭제할 댓글 ID
	 * @param deletedBy 삭제 요청자 ID (쿼리 파라미터로 전달)
	 */
	public void deleteComment(Integer commentId, Long deletedBy) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "?deletedBy=" + deletedBy);
			restTemplate.delete(uri);
			log.info("deleteComment called for comment ID: {}", commentId);
		} catch (Exception e) {
			log.error("Error deleting comment: {}", e.getMessage());
		}
	}

	/**
	 * [댓글 하드 삭제 메서드]
	 * KR: 관리자 전용으로 Flask의 /forum/comment/{commentId}/hard-delete 엔드포인트를 호출하여 댓글을 완전 삭제합니다.
	 *
	 * @param commentId 삭제할 댓글 ID
	 */
	public void hardDeleteComment(Integer commentId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/hard-delete");
			restTemplate.delete(uri);
			log.info("hardDeleteComment called for comment ID: {}", commentId);
		} catch (Exception e) {
			log.error("Error in hardDeleteComment: {}", e.getMessage());
		}
	}

	/**
	 * [댓글 신고 처리 메서드]
	 * KR: Flask의 /forum/comment/{commentId}/report 엔드포인트를 호출하여 댓글 신고를 처리합니다.
	 *
	 * @param commentId  신고할 댓글 ID
	 * @param reporterId 신고자 ID
	 * @param reason     신고 사유
	 * @return 업데이트된 ForumPostCommentResponseDto
	 */
	public ForumPostCommentResponseDto reportComment(Integer commentId, Integer reporterId, String reason) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/report");
			String jsonBody = String.format("{\"reporterId\": %d, \"reason\": \"%s\"}", reporterId, reason);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.POST, entity, String.class);
			log.info("reportComment response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
		} catch (Exception e) {
			log.error("Error reporting comment: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [댓글 숨김 처리 메서드]
	 * KR: Flask의 /forum/comment/{commentId}/hide 엔드포인트를 호출하여 댓글을 숨김 처리합니다.
	 *
	 * @param commentId 숨길 댓글 ID
	 */
	public void hideComment(Integer commentId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/hide");
			restTemplate.postForEntity(uri, null, String.class);
			log.info("hideComment called for comment ID: {}", commentId);
		} catch (Exception e) {
			log.error("Error hiding comment: {}", e.getMessage());
		}
	}

	/**
	 * [댓글 복원 메서드]
	 * KR: Flask의 /forum/comment/{commentId}/restore 엔드포인트를 호출하여 댓글을 복원합니다.
	 *
	 * @param commentId 복원할 댓글 ID
	 * @return 복원된 ForumPostCommentResponseDto
	 */
	public ForumPostCommentResponseDto restoreComment(Integer commentId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/restore");
			ResponseEntity<String> response = restTemplate.postForEntity(uri, null, String.class);
			log.info("restoreComment response: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
		} catch (Exception e) {
			log.error("Error restoring comment: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [댓글 좋아요 증가 메서드]
	 * KR: Flask의 /forum/comment/{commentId}/increment-like 엔드포인트를 호출하여 댓글 좋아요 수를 증가시킵니다.
	 *
	 * @param commentId 댓글 ID
	 */
	public void incrementCommentLikes(Integer commentId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/increment-like");
			restTemplate.postForEntity(uri, null, String.class);
			log.info("incrementCommentLikes called for comment ID: {}", commentId);
		} catch (Exception e) {
			log.error("Error incrementing comment likes: {}", e.getMessage());
		}
	}


	/**
	 * [카테고리 생성 메서드]
	 * KR: Flask의 /forum/category 엔드포인트를 호출하여 새로운 카테고리를 ElasticSearch에 인덱싱합니다.
	 *
	 * @param categoryDto 생성할 카테고리 정보 DTO
	 * @return 생성된 ForumCategoryDto 객체
	 */
	public ForumCategoryDto createCategory(ForumCategoryDto categoryDto) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/category");
			String jsonBody = objectMapper.writeValueAsString(categoryDto);
			HttpEntity<String> entity = new HttpEntity<>(jsonBody);
			ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
			log.info("createCategory 응답: {}", response);
			return objectMapper.readValue(response.getBody(), ForumCategoryDto.class);
		} catch (Exception e) {
			log.error("카테고리 생성 중 오류 발생: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [카테고리 제목으로 조회 메서드]
	 * KR: Flask의 /forum/category/search?title=... 엔드포인트를 호출하여 ElasticSearch에서 특정 제목의 카테고리를 조회합니다.
	 *
	 * @param title 조회할 카테고리 제목
	 * @return 조회된 ForumCategoryDto 객체 (없으면 null)
	 */
	public ForumCategoryDto getCategoryByTitle(String title) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/category/search?title=" + URLEncoder.encode(title, StandardCharsets.UTF_8));
			ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
			log.info("getCategoryByTitle 응답: {}", response);
			return objectMapper.readValue(response.getBody(), ForumCategoryDto.class);
		} catch (Exception e) {
			log.error("카테고리 제목으로 조회 중 오류 발생: {}", e.getMessage());
			return null;
		}
	}


	/**
	 * [포럼 카테고리 전체 조회 메서드]
	 * <p>
	 *     Flask의 /forum/category 엔드포인트를 호출하여 ElasticSearch에 인덱싱된 모든 카테고리를 조회합니다.
	 * </p>
	 *
	 * @return ForumCategoryDto 객체들의 리스트
	 */
	public List<ForumCategoryDto> getAllCategoriesFromElastic() {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/category");
			ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
			log.info("getAllCategoriesFromElastic 응답: {}", response);
			return objectMapper.readValue(response.getBody(),
					objectMapper.getTypeFactory().constructCollectionType(List.class, ForumCategoryDto.class));
		} catch (Exception e) {
			log.error("ElasticSearch에서 카테고리 조회 중 오류 발생: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [카테고리 ID 조회 메서드]
	 * <p>
	 *     Flask의 /forum/category/{id} 엔드포인트를 호출하여 특정 카테고리를 조회합니다.
	 * </p>
	 *
	 * @param categoryId 조회할 카테고리 ID
	 * @return 조회된 ForumCategoryDto 객체
	 */
	public ForumCategoryDto getCategoryById(Integer categoryId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/category/" + categoryId);
			ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
			log.info("getCategoryById 응답: {}", response);
			return objectMapper.readValue(response.getBody(), ForumCategoryDto.class);
		} catch (Exception e) {
			log.error("ElasticSearch에서 카테고리 ID 조회 중 오류 발생: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [게시글 좋아요 토글 메서드]
	 * KR: Flask의 /forum/post/{postId}/like 엔드포인트를 호출하여 게시글 좋아요를 토글합니다.
	 *
	 * @param postId   게시글 ID
	 * @param memberId 요청 사용자 ID
	 * @return 좋아요 결과 DTO
	 */
	public ForumPostLikeResponseDto togglePostLike(Integer postId, Long memberId) {
		try {
			// 구성된 엔드포인트 URL (쿼리 파라미터를 통해 memberId 전달)
			URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/like?memberId=" + memberId);
			ResponseEntity<String> response = restTemplate.postForEntity(uri, null, String.class);
			log.info("togglePostLike 응답: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostLikeResponseDto.class);
		} catch (Exception e) {
			log.error("게시글 좋아요 토글 중 오류 발생: {}", e.getMessage());
			return null;
		}
	}

	/**
	 * [댓글 좋아요 토글 메서드]
	 * KR: Flask의 /forum/comment/{commentId}/like 엔드포인트를 호출하여 댓글 좋아요를 토글합니다.
	 *
	 * @param commentId 댓글 ID
	 * @param memberId  요청 사용자 ID
	 * @return 좋아요 결과 DTO
	 */
	public ForumPostLikeResponseDto toggleCommentLike(Integer commentId, Long memberId) {
		try {
			URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/like?memberId=" + memberId);
			ResponseEntity<String> response = restTemplate.postForEntity(uri, null, String.class);
			log.info("toggleCommentLike 응답: {}", response);
			return objectMapper.readValue(response.getBody(), ForumPostLikeResponseDto.class);
		} catch (Exception e) {
			log.error("댓글 좋아요 토글 중 오류 발생: {}", e.getMessage());
			return null;
		}
	}
}
