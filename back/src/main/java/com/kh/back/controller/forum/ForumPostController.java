package com.kh.back.controller.forum;

import com.kh.back.dto.forum.request.ForumPostRequestDto;
import com.kh.back.dto.forum.response.ForumPostResponseDto;
import com.kh.back.dto.forum.response.PaginationDto;
import com.kh.back.service.forum.FileService;
import com.kh.back.service.forum.ForumPostService;
import com.kh.back.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 게시글 컨트롤러 클래스
 * <p>REST API 엔드포인트를 정의하고, Service 계층을 호출합니다.</p>
 * <p>컨트롤러에서는 최소한의 파라미터 검증(예: null 체크, 빈 문자열 체크)만 수행하며,
 * 비즈니스 로직에서 발생하는 예외는 Service 계층이 throw하고,
 * 전역 예외 처리(@ControllerAdvice 등)에서 처리합니다.</p>
 */
@RestController
@RequestMapping("/api/forums/posts")
@RequiredArgsConstructor
@Slf4j
public class ForumPostController {

    private final ForumPostService postService; // Service 계층 의존성 주입
    private final MemberService memberService;
    private final FileService fileService;

    /**
     * 특정 카테고리의 게시글 가져오기 (페이지네이션)
     *
     * @param categoryId 카테고리 ID
     * @param page 페이지 번호 (1부터 시작)
     * @param size 페이지 크기
     * @return 게시글 목록 (페이지네이션 포함)
     */
    @GetMapping
    public ResponseEntity<PaginationDto<ForumPostResponseDto>> getPostsByCategory(
            @RequestParam Integer categoryId,
            @RequestParam int page,
            @RequestParam int size
    ) {
        // 페이지 파라미터 보정(1-based -> 0-based)
        int zeroBasedPage = page > 0 ? page - 1 : 0;

        // 간단한 null 체크 등은 생략 가능. (categoryId가 null이면 이미 @RequestParam에서 예외)
        // Service 호출
        PaginationDto<ForumPostResponseDto> pagination =
                postService.getPostsByCategory(categoryId, zeroBasedPage, size);

        return ResponseEntity.ok(pagination);
    }

    /**
     * 게시글 생성
     * <p>간단한 파라미터(필드) 검증 후, 서비스 계층에서 예외 발생 시 전역 예외 처리로 전달</p>
     *
     * @param requestDto 게시글 데이터 (제목, 내용, 카테고리 ID 등)
     * @return 생성된 게시글 정보
     */
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody ForumPostRequestDto requestDto) {
        log.info("Creating post with title: {}", requestDto.getTitle());

        // 1) 필수 필드 검증(간단 체크)
        if (requestDto.getMemberId() == null) {
            log.warn("Member ID is missing in the request.");
            return ResponseEntity.badRequest().body("Member ID is required.");
        }
        if (requestDto.getCategoryId() == null) {
            log.warn("Category ID is missing in the request.");
            return ResponseEntity.badRequest().body("Category ID is required.");
        }
        if (requestDto.getTitle() == null || requestDto.getTitle().isEmpty()) {
            log.warn("Title is missing or empty.");
            return ResponseEntity.badRequest().body("Title is required.");
        }
        if (requestDto.getContent() == null || requestDto.getContent().isEmpty()) {
            log.warn("Content is missing or empty.");
            return ResponseEntity.badRequest().body("Content is required.");
        }

        // 2) 서비스 호출 (예외 발생 시 전역 예외 처리기로 전달)
        ForumPostResponseDto responseDto = postService.createPost(requestDto);
        log.info("Post created successfully with ID: {}", responseDto.getId());

        // 3) 생성 성공 응답
        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    /**
     * 게시글 제목 수정
     *
     * @param postId 수정할 게시글 ID
     * @param body   새로운 제목을 포함한 JSON
     * @param loggedInMemberId 요청 사용자 ID
     * @return 수정된 게시글 정보
     */
    @PutMapping("/{postId}/title")
    public ResponseEntity<ForumPostResponseDto> updatePostTitle(
            @PathVariable Integer postId,
            @RequestBody Map<String, String> body,
            @RequestParam Integer loggedInMemberId
    ) {
        log.info("Updating post title for ID: {} by member ID: {}", postId, loggedInMemberId);

        // 1) 관리자 여부 판단
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);

        // 2) body에서 새 title 추출
        String newTitle = body.get("title");

        // 3) Service 호출
        ForumPostResponseDto updatedPost = postService.updatePostTitle(
                postId, newTitle, loggedInMemberId, isAdmin
        );

        // 4) 성공 응답
        return ResponseEntity.ok(updatedPost);
    }

    /**
     * 게시글 내용 수정 (TipTap JSON 전용)
     *
     * @param postId 수정할 게시글 ID
     * @param body   { "contentJSON": "..." } 형태
     * @param loggedInMemberId 요청 사용자 ID
     * @return 수정된 게시글 정보
     */
    @PutMapping("/{postId}/content")
    public ResponseEntity<ForumPostResponseDto> updatePostContent(
            @PathVariable Integer postId,
            @RequestBody Map<String, String> body,
            @RequestParam Integer loggedInMemberId
    ) {
        log.info("게시글 내용을 수정합니다. 게시글 ID: {} / 요청자 ID: {}", postId, loggedInMemberId);

        // 1) 관리자 여부 판단
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);

        // 2) body에서 contentJSON 추출 (비어있으면 서비스 계층에서 예외 발생 가능)
        String contentJSON = body.get("contentJSON");

        // 3) Service 호출
        ForumPostResponseDto updatedPost = postService.updatePostContent(
                postId, contentJSON, loggedInMemberId, isAdmin
        );

        // 4) 성공 응답
        return ResponseEntity.ok(updatedPost);
    }

    /**
     * 게시글 삭제 (소프트 삭제)
     * <p>삭제 권한(작성자 또는 관리자)이 없으면 Service 계층에서 예외 발생</p>
     *
     * @param id 삭제할 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @param removedBy 삭제를 수행한 사용자 정보 (ADMIN 또는 작성자 이름)
     * @return 성공 상태(200 OK)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Integer id,
            @RequestParam Integer loggedInMemberId,
            @RequestParam String removedBy
    ) {
        // Service 계층에서 권한 검사 및 삭제 처리
        postService.deletePost(id, loggedInMemberId, removedBy);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 하드 삭제 (관리자 전용)
     * <p>게시글 및 연관 댓글 등을 DB에서 완전히 삭제합니다.</p>
     *
     * @param id 삭제할 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID (관리자여야 함)
     * @return 성공 상태(200 OK)
     */
    @DeleteMapping("/{id}/hard-delete")
    public ResponseEntity<Void> hardDeletePost(
            @PathVariable Integer id,
            @RequestParam Integer loggedInMemberId
    ) {
        // 1) 관리자 여부 확인
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        if (!isAdmin) {
            // 403 Forbidden
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // 2) 관리자만 호출 가능
        postService.hardDeletePost(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 숨김 처리
     *
     * @param postId 숨길 게시글 ID
     * @return 성공 상태(200 OK)
     */
    @PostMapping("/{postId}/hide")
    public ResponseEntity<Void> hidePost(@PathVariable Integer postId) {
        postService.hidePost(postId);
        return ResponseEntity.ok().build();
    }

    /**
     * 숨겨진 게시글 복구
     *
     * @param postId 복구할 게시글 ID
     * @return 성공 상태(200 OK)
     */
    @PostMapping("/{postId}/restore")
    public ResponseEntity<Void> restorePost(@PathVariable Integer postId) {
        postService.restorePost(postId);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 수정 권한 확인
     *
     * @param id 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @return 게시글 수정 권한 여부
     */
    @GetMapping("/{id}/can-edit")
    public ResponseEntity<Boolean> canEditPost(
            @PathVariable Integer id,
            @RequestParam Integer loggedInMemberId
    ) {
        boolean canEdit = postService.canEditPost(id, loggedInMemberId);
        return ResponseEntity.ok(canEdit);
    }

    /**
     * 게시글 삭제 권한 확인
     *
     * @param id 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @return 게시글 삭제 권한 여부
     */
    @GetMapping("/{id}/can-delete")
    public ResponseEntity<Boolean> canDeletePost(
            @PathVariable Integer id,
            @RequestParam Integer loggedInMemberId
    ) {
        boolean canDelete = postService.canDeletePost(id, loggedInMemberId);
        return ResponseEntity.ok(canDelete);
    }

    /**
     * 특정 게시글 조회
     *
     * @param id 게시글 ID
     * @return 게시글 상세 정보 (없으면 404)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ForumPostResponseDto> getPostDetails(@PathVariable Integer id) {
        return postService.getPostDetails(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 게시글 조회수 증가
     *
     * @param id 게시글 ID
     * @return 성공 상태(200 OK)
     */
    @PostMapping("/{id}/increment-view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable Integer id) {
        postService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 인용
     *
     * @param quotingMemberId 인용하는 회원 ID
     * @param quotedPostId 인용 대상 게시글 ID
     * @param commentContent 추가 댓글 내용
     * @return 인용된 게시글 정보
     */
    @PostMapping("/{id}/quote")
    public ResponseEntity<ForumPostResponseDto> quotePost(
            @RequestParam Integer quotingMemberId,
            @PathVariable("id") Integer quotedPostId,
            @RequestBody String commentContent
    ) {
        ForumPostResponseDto quoted = postService.quotePost(quotingMemberId, quotedPostId, commentContent);
        return ResponseEntity.ok(quoted);
    }

    /**
     * 게시글 신고 처리
     *
     * @param postId 신고할 게시글 ID
     * @param reporterId 신고자 ID
     * @param reason 신고 사유
     * @return 신고 결과 (업데이트된 게시글 정보 포함)
     */
    @PostMapping("/{postId}/report")
    public ResponseEntity<ForumPostResponseDto> reportPost(
            @PathVariable Integer postId,
            @RequestParam Integer reporterId,
            @RequestBody String reason
    ) {
        ForumPostResponseDto responseDto = postService.reportPost(postId, reporterId, reason);
        return ResponseEntity.ok(responseDto);
    }
}
