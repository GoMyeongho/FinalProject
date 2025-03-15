package com.kh.back.service.python;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kh.back.dto.forum.request.ForumPostCommentRequestDto;
import com.kh.back.dto.forum.request.ForumPostRequestDto;
import com.kh.back.dto.forum.response.*;
import com.kh.back.dto.python.SearchListResDto;
import com.kh.back.dto.python.SearchResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ForumEsService
 *
 * Flask 백엔드(/forum/*)와 연동하여
 * 게시글, 댓글, 카테고리, 좋아요 등 포럼 기능을 처리하는 서비스 클래스입니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ForumEsService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String flaskBaseUrl = "http://localhost:5001";

    // === 게시글 관련 메서드 ===

    /**
     * 게시글 생성
     */
    public ForumPostResponseDto createPost(ForumPostRequestDto requestDto) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post");
            String jsonBody = objectMapper.writeValueAsString(requestDto);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
            log.info("createPost 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
        } catch (Exception e) {
            log.error("게시글 생성 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 게시글 제목 수정
     */
    public ForumPostResponseDto updatePostTitle(String postId, String newTitle, String editedBy) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/title");
            String jsonBody = String.format("{\"title\": \"%s\", \"editedBy\": \"%s\"}", newTitle, editedBy);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.PUT, entity, String.class);
            log.info("updatePostTitle 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
        } catch (Exception e) {
            log.error("게시글 제목 수정 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 게시글 내용 수정 메서드 (Flask 백엔드에 요청)
     *
     * 이 메서드는 게시글의 contentJSON, 수정자 정보(editedBy) 및 관리자 여부(isAdmin)를
     * 포함하는 payload를 생성하여 Flask의 /forum/post/{postId}/content 엔드포인트로 PUT 요청을 보냅니다.
     *
     * 기존의 String.format 방식을 대체하여, Map을 사용한 후 ObjectMapper.writeValueAsString으로 직렬화합니다.
     * 이 방법은 내부 따옴표(큰따옴표 등)가 올바르게 이스케이프되어 잘못된 JSON 형식을 방지합니다.
     *
     * @param postId 수정할 게시글 ID
     * @param contentJSON 수정된 TipTap JSON 형식의 내용 (문자열)
     * @param editedBy 수정한 사용자의 ID 또는 "ADMIN"
     * @param isAdmin 관리자 여부 (true이면 관리자 수정)
     * @return 수정된 게시글 정보를 담은 ForumPostResponseDto, 실패 시 null 반환
     */
    public ForumPostResponseDto updatePostContent(String postId, String contentJSON, String editedBy, boolean isAdmin) {
        try {
            // Flask 엔드포인트 URI 구성
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/content");

            // 수정할 데이터(payload)를 Map으로 구성
            Map<String, Object> payload = new HashMap<>();
            payload.put("contentJSON", contentJSON);  // TipTap JSON 문자열
            payload.put("editedBy", editedBy);          // 수정자 정보
            payload.put("isAdmin", isAdmin);            // 관리자 여부

            // ObjectMapper를 사용하여 Map을 JSON 문자열로 직렬화 (내부 따옴표 자동 이스케이프)
            String jsonBody = objectMapper.writeValueAsString(payload);

            // HTTP 요청 헤더 설정 (Content-Type: application/json)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            // PUT 요청을 보내 Flask 백엔드에 수정 요청 수행
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.PUT, entity, String.class);
            log.info("updatePostContent 응답: {}", response);

            // 응답 본문을 ForumPostResponseDto 객체로 역직렬화하여 반환
            return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
        } catch (Exception e) {
            log.error("게시글 내용 수정 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 게시글 삭제 (소프트 삭제)
     */
    public boolean deletePost(String postId, String removedBy) {
        try {
            // removedBy를 쿼리 파라미터로 전송
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId
                    + "?removedBy=" + URLEncoder.encode(removedBy, StandardCharsets.UTF_8));

            restTemplate.delete(uri);
            log.info("deletePost 호출됨, 게시글 ID: {}", postId);
            return true;
        } catch (Exception e) {
            log.error("게시글 삭제 중 오류: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 게시글 하드 삭제 (관리자 전용)
     */
    public boolean hardDeletePost(String postId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/hard-delete");
            restTemplate.delete(uri);
            log.info("hardDeletePost 호출됨, 게시글 ID: {}", postId);
            return true;
        } catch (Exception e) {
            log.error("게시글 하드 삭제 중 오류: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 게시글 신고
     */
    public ForumPostResponseDto reportPost(String postId, Integer reporterId, String reason) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/report");
            String jsonBody = String.format("{\"reporterId\": %d, \"reason\": \"%s\"}", reporterId, reason);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.POST, entity, String.class);
            log.info("reportPost 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostResponseDto.class);
        } catch (Exception e) {
            log.error("게시글 신고 처리 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 게시글 숨김 처리
     */
    public boolean hidePost(String postId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/hide");
            restTemplate.postForEntity(uri, null, String.class);
            log.info("hidePost 호출됨, 게시글 ID: {}", postId);
            return true;
        } catch (Exception e) {
            log.error("게시글 숨김 처리 중 오류: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 게시글 복구
     */
    public boolean restorePost(String postId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/restore");
            restTemplate.postForEntity(uri, null, String.class);
            log.info("restorePost 호출됨, 게시글 ID: {}", postId);
            return true;
        } catch (Exception e) {
            log.error("게시글 복구 중 오류: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 게시글 조회수 증가
     */
    public boolean incrementViewCount(String postId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/increment-view");
            restTemplate.postForEntity(uri, null, String.class);
            log.info("incrementViewCount 호출됨, 게시글 ID: {}", postId);
            return true;
        } catch (Exception e) {
            log.error("게시글 조회수 증가 중 오류: {}", e.getMessage());
            return false;
        }
    }

    // === 검색 및 상세조회 관련 메서드 ===

    /**
     * 포럼 게시글 검색 메서드
     * - Flask의 /search 엔드포인트를 호출하며, type=forum_post를 사용합니다.
     * - 페이지 값이 1보다 작으면 강제로 1로 설정하여 음수 offset이 발생하지 않도록 합니다.
     */
    public List<ForumPostResponseDto> search(String q, String category, int page, int size) {
        try {
            // 1. 페이지 값이 1보다 작으면 안전하게 1로 설정합니다.
            int safePage = page < 1 ? 1 : page;

            // 2. 검색어와 타입을 URL 인코딩합니다.
            String encodedQ = URLEncoder.encode(q, StandardCharsets.UTF_8);
            String encodedType = URLEncoder.encode("forum_post", StandardCharsets.UTF_8); // 타입을 forum_post로 고정
            String categoryParam = (category != null && !category.isEmpty())
                    ? "&category=" + URLEncoder.encode(category, StandardCharsets.UTF_8)
                    : "";

            // 3. Flask 백엔드로 보낼 URI를 생성합니다.
            //    예: http://localhost:5001/search?q=...&type=forum_post&category=...&page=safePage&size=...
            URI uri = new URI(flaskBaseUrl + "/search?q=" + encodedQ
                    + "&type=" + encodedType
                    + categoryParam
                    + "&page=" + safePage
                    + "&size=" + size);

            log.info("[ForumEsService.search] 호출 URI: {}", uri);

            // 4. Flask에 GET 요청을 보냅니다.
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            log.info("[ForumEsService.search] 응답: {}", response);

            // 5. 응답 JSON을 ForumPostResponseDto 배열로 역직렬화합니다.
            ForumPostResponseDto[] array = objectMapper.readValue(response.getBody(), ForumPostResponseDto[].class);
            List<ForumPostResponseDto> resultList = new ArrayList<>();
            for (ForumPostResponseDto item : array) {
                resultList.add(item);
            }
            return resultList;

        } catch (Exception e) {
            log.error("포럼 검색 중 오류: {}", e.getMessage());
            return null;
        }
    }



    /**
     * 포럼 게시글 상세 조회
     * - Flask에서 "/forum/post/{postId}" 엔드포인트를 호출하여 상세 게시글 정보를 가져옵니다.
     * - 만약 날짜 파싱 오류가 발생하면, ForumPostResponseDto의 날짜 필드를 LocalDateTime 대신 OffsetDateTime로 변경하거나,
     *   ObjectMapper에 JavaTimeModule을 등록하는 방법을 고려하세요.
     *
     * @param postId 조회할 게시글의 ID
     * @return ForumPostResponseDto 객체 (게시글 상세 정보)
     */
    public ForumPostResponseDto detail(String postId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId);
            log.info("[ForumEsService.detail] 호출 URI: {}", uri);

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            String responseBody = response.getBody();
            log.info("[ForumEsService.detail] Raw JSON from Flask: {}", responseBody);

            ForumPostResponseDto dto = objectMapper.readValue(responseBody, ForumPostResponseDto.class);
            // 디버그 로그 추가: 모든 주요 필드 출력
            log.debug("[ForumEsService.detail] Deserialized DTO:" +
                            " id={}, title={}, content={}, authorName={}, memberId={}, createdAt={}, updatedAt={}, " +
                            "contentJSON={}, sticky={}, viewsCount={}, likesCount={}, reportCount={}",
                    dto.getId(), dto.getTitle(), dto.getContent(), dto.getAuthorName(),
                    dto.getMemberId(), dto.getCreatedAt(), dto.getUpdatedAt(),
                    dto.getContentJSON(), dto.getSticky(), dto.getViewsCount(), dto.getLikesCount(),
                    dto.getReportCount());
            return dto;
        } catch (Exception e) {
            log.error("포럼 상세조회 중 오류: {}", e.getMessage());
            return null;
        }
    }


    // === 댓글 관련 메서드 (commentId는 Integer 그대로 사용) ===

    public ForumPostCommentResponseDto createComment(ForumPostCommentRequestDto requestDto) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment");
            String jsonBody = objectMapper.writeValueAsString(requestDto);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
            log.info("createComment 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
        } catch (Exception e) {
            log.error("댓글 생성 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 댓글 수정 (TipTap JSON 콘텐츠 업데이트)
     * - Flask 백엔드의 "/forum/comment/{commentId}" 엔드포인트를 호출합니다.
     * - postId, contentJSON, editedBy, isAdmin 등의 정보를 JSON 페이로드로 전달합니다.
     *
     * @param commentId 수정할 댓글의 ID
     * @param requestDto 수정 요청 데이터 (postId, contentJSON 등 포함)
     * @param editedBy   수정 요청한 사용자의 ID 또는 "ADMIN"
     * @param isAdmin    관리자 여부 (true이면 관리자 수정)
     * @return 수정된 댓글 정보 (Response DTO), 오류 발생 시 null 반환
     */
    public ForumPostCommentResponseDto updateComment(Integer commentId,
                                                     ForumPostCommentRequestDto requestDto,
                                                     String editedBy,
                                                     boolean isAdmin) {
        try {
            // Flask의 올바른 댓글 수정 엔드포인트는 "/forum/comment/{commentId}" 입니다.
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId);

            // JSON 페이로드 구성: postId, contentJSON, editedBy, isAdmin 값을 포함
            String jsonBody = String.format(
                    "{\"postId\": \"%s\", \"contentJSON\": \"%s\", \"editedBy\": \"%s\", \"isAdmin\": %s}",
                    requestDto.getPostId(), requestDto.getContentJSON(), editedBy, isAdmin
            );

            // HTTP 헤더에 Content-Type을 JSON으로 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            // PUT 메서드를 사용하여 Flask 엔드포인트에 요청 전송
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.PUT, entity, String.class);
            log.info("updateComment 응답: {}", response);

            // 응답 본문을 ForumPostCommentResponseDto 객체로 변환 후 반환
            return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
        } catch (Exception e) {
            log.error("댓글 수정 중 오류: {}", e.getMessage());
            return null;
        }
    }


    /**
     * 특정 게시글에 대한 댓글 목록 조회
     * KR: Flask 백엔드에서 정의한 '/forum/comments' 엔드포인트를 호출합니다.
     *     이 엔드포인트는 쿼리 파라미터 'postId'를 사용하여 해당 게시글의 댓글 배열을 반환합니다.
     */
    public List<ForumPostCommentResponseDto> searchCommentsForPost(String postId) {
        try {
            // 올바른 엔드포인트: /forum/comments?postId=...
            URI uri = new URI(flaskBaseUrl + "/forum/comments?postId=" + postId);
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            log.info("searchCommentsForPost 응답: {}", response);

            return objectMapper.readValue(
                    response.getBody(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ForumPostCommentResponseDto.class)
            );
        } catch (Exception e) {
            log.error("댓글 목록 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }


    public boolean deleteComment(Integer commentId, Long deletedBy) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "?deletedBy=" + deletedBy);
            restTemplate.delete(uri);
            log.info("deleteComment 호출됨, 댓글 ID: {}", commentId);
            return true;
        } catch (Exception e) {
            log.error("댓글 삭제 중 오류: {}", e.getMessage());
            return false;
        }
    }

    public boolean hardDeleteComment(Integer commentId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/hard-delete");
            restTemplate.delete(uri);
            log.info("hardDeleteComment 호출됨, 댓글 ID: {}", commentId);
            return true;
        } catch (Exception e) {
            log.error("댓글 하드 삭제 중 오류: {}", e.getMessage());
            return false;
        }
    }

    public ForumPostCommentResponseDto reportComment(Integer commentId, Integer reporterId, String reason) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/report");
            String jsonBody = String.format("{\"reporterId\": %d, \"reason\": \"%s\"}", reporterId, reason);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.POST, entity, String.class);
            log.info("reportComment 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
        } catch (Exception e) {
            log.error("댓글 신고 처리 중 오류: {}", e.getMessage());
            return null;
        }
    }

    public boolean hideComment(Integer commentId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/hide");
            restTemplate.postForEntity(uri, null, String.class);
            log.info("hideComment 호출됨, 댓글 ID: {}", commentId);
            return true;
        } catch (Exception e) {
            log.error("댓글 숨김 처리 중 오류: {}", e.getMessage());
            return false;
        }
    }

    public ForumPostCommentResponseDto restoreComment(Integer commentId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/restore");
            ResponseEntity<String> response = restTemplate.postForEntity(uri, null, String.class);
            log.info("restoreComment 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostCommentResponseDto.class);
        } catch (Exception e) {
            log.error("댓글 복원 중 오류: {}", e.getMessage());
            return null;
        }
    }

    public boolean incrementCommentLikes(Integer commentId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/increment-like");
            restTemplate.postForEntity(uri, null, String.class);
            log.info("incrementCommentLikes 호출됨, 댓글 ID: {}", commentId);
            return true;
        } catch (Exception e) {
            log.error("댓글 좋아요 증가 중 오류: {}", e.getMessage());
            return false;
        }
    }

    // === 카테고리 관련 메서드 (categoryId는 Integer 유지) ===

    public ForumCategoryDto createCategory(ForumCategoryDto categoryDto) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/category");
            String jsonBody = objectMapper.writeValueAsString(categoryDto);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            log.info("카테고리 생성 요청: '{}' URI: {} / body: {}", categoryDto.getTitle(), uri, jsonBody);
            ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
            log.info("카테고리 생성 응답: {}", response.getBody());

            return objectMapper.readValue(response.getBody(), ForumCategoryDto.class);
        } catch (Exception e) {
            log.error("카테고리 생성 중 오류 ('{}'): {}", categoryDto.getTitle(), e.getMessage());
            return null;
        }
    }

    public ForumCategoryDto getCategoryByTitle(String title) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/category/search?title="
                    + URLEncoder.encode(title, StandardCharsets.UTF_8));
            log.info("카테고리 제목 조회 요청: '{}' URI: {}", title, uri);

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            log.info("카테고리 조회 응답: {}", response.getBody());

            return objectMapper.readValue(response.getBody(), ForumCategoryDto.class);
        } catch (Exception e) {
            log.error("카테고리 제목 조회 중 오류 ('{}'): {}", title, e.getMessage());
            return null;
        }
    }

    public List<ForumCategoryDto> getAllCategoriesFromElastic() {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/category");
            log.info("전체 카테고리 조회 요청, URI: {}", uri);

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            log.info("전체 카테고리 조회 응답: {}", response.getBody());

            return objectMapper.readValue(
                    response.getBody(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ForumCategoryDto.class)
            );
        } catch (Exception e) {
            log.error("전체 카테고리 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }

    public ForumCategoryDto getCategoryById(String categoryId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/category/" + categoryId);
            log.info("카테고리 ID 조회 요청: '{}' URI: {}", categoryId, uri);

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            log.info("카테고리 ID 조회 응답: {}", response.getBody());

            return objectMapper.readValue(response.getBody(), ForumCategoryDto.class);
        } catch (Exception e) {
            log.error("카테고리 ID 조회 중 오류 (ID: {}): {}", categoryId, e.getMessage());
            return null;
        }
    }

    // === 좋아요(Like) 토글 메서드 ===

    /**
     * 게시글 좋아요 토글
     */
    public ForumPostLikeResponseDto togglePostLike(String postId, Long memberId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/post/" + postId + "/like");
            String jsonBody = "{\"memberId\": " + memberId + "}";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
            log.info("togglePostLike 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostLikeResponseDto.class);
        } catch (Exception e) {
            log.error("게시글 좋아요 토글 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 댓글 좋아요 토글 (commentId는 Integer 그대로)
     */
    public ForumPostLikeResponseDto toggleCommentLike(Integer commentId, Long memberId, String postId) {
        try {
            URI uri = new URI(flaskBaseUrl + "/forum/comment/" + commentId + "/like");
            String jsonBody = "{\"memberId\": " + memberId + ", \"postId\": \"" + postId + "\"}";
            // 주의: 댓글 좋아요의 경우, 어느 게시글의 댓글인지도 필요하므로 postId를 함께 보냅니다.

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(uri, entity, String.class);
            log.info("toggleCommentLike 응답: {}", response);

            return objectMapper.readValue(response.getBody(), ForumPostLikeResponseDto.class);
        } catch (Exception e) {
            log.error("댓글 좋아요 토글 중 오류: {}", e.getMessage());
            return null;
        }
    }

}
