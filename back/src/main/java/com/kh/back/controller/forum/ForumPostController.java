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

import java.util.Map;

/**
 * 게시글 컨트롤러 클래스
 * <p>ElasticSearch 기반의 ForumPostService를 호출하여 게시글 관련 REST API 엔드포인트를 제공합니다.</p>
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
     * @param page       페이지 번호 (1부터 시작)
     * @param size       페이지 크기
     * @return 게시글 목록 (페이지네이션 포함)
     */
    @GetMapping
    public ResponseEntity<PaginationDto<ForumPostResponseDto>> getPostsByCategory(
            @RequestParam Integer categoryId,
            @RequestParam int page,
            @RequestParam int size
    ) {
        // 페이지 파라미터 보정 (1-based -> 0-based)
        int zeroBasedPage = page > 0 ? page - 1 : 0;

        // ES 기반으로 검색하여 PaginationDto 반환 (totalHits 관련 개선 필요)
        PaginationDto<ForumPostResponseDto> pagination =
                postService.getPostsByCategory(categoryId, zeroBasedPage, size);

        return ResponseEntity.ok(pagination);
    }

    /**
     * 게시글 생성
     *
     * @param requestDto 게시글 데이터 (제목, 내용, 카테고리 ID 등)
     * @return 생성된 게시글 정보
     */
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody ForumPostRequestDto requestDto) {
        log.info("게시글 생성 요청, 제목: {}", requestDto.getTitle());

        // 필수 필드 검증
        if (requestDto.getMemberId() == null) {
            log.warn("요청에 회원 ID가 누락되었습니다.");
            return ResponseEntity.badRequest().body("회원 ID는 필수입니다.");
        }
        if (requestDto.getCategoryId() == null) {
            log.warn("요청에 카테고리 ID가 누락되었습니다.");
            return ResponseEntity.badRequest().body("카테고리 ID는 필수입니다.");
        }
        if (requestDto.getTitle() == null || requestDto.getTitle().isEmpty()) {
            log.warn("요청에 제목이 누락되었거나 비어있습니다.");
            return ResponseEntity.badRequest().body("제목은 필수입니다.");
        }
        if (requestDto.getContent() == null || requestDto.getContent().isEmpty()) {
            log.warn("요청에 내용이 누락되었거나 비어있습니다.");
            return ResponseEntity.badRequest().body("내용은 필수입니다.");
        }

        // 서비스 호출 (ElasticSearch 기반)
        ForumPostResponseDto responseDto = postService.createPost(requestDto);
        log.info("게시글 생성 성공, ID: {}", responseDto.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
    }

    /**
     * 게시글 제목 수정
     *
     * @param postId           수정할 게시글 ID
     * @param body             새로운 제목을 포함한 JSON
     * @param loggedInMemberId 요청 사용자 ID (Long 타입)
     * @return 수정된 게시글 정보
     */
    @PutMapping("/{postId}/title")
    public ResponseEntity<ForumPostResponseDto> updatePostTitle(
            @PathVariable Integer postId,
            @RequestBody Map<String, String> body,
            @RequestParam Long loggedInMemberId
    ) {
        log.info("게시글 제목 수정 요청, 게시글 ID: {} / 사용자 ID: {}", postId, loggedInMemberId);

        // 관리자 여부 판단
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        String newTitle = body.get("title");

        // 서비스 호출
        ForumPostResponseDto updatedPost = postService.updatePostTitle(
                postId, newTitle, loggedInMemberId, isAdmin
        );
        return ResponseEntity.ok(updatedPost);
    }

    /**
     * 게시글 내용 수정 (TipTap JSON)
     *
     * @param postId           수정할 게시글 ID
     * @param body             { "contentJSON": "..." } 형태의 JSON
     * @param loggedInMemberId 요청 사용자 ID (Long 타입)
     * @return 수정된 게시글 정보
     */
    @PutMapping("/{postId}/content")
    public ResponseEntity<ForumPostResponseDto> updatePostContent(
            @PathVariable Integer postId,
            @RequestBody Map<String, String> body,
            @RequestParam Long loggedInMemberId
    ) {
        log.info("게시글 내용 수정 요청, 게시글 ID: {} / 사용자 ID: {}", postId, loggedInMemberId);

        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        String contentJSON = body.get("contentJSON");

        ForumPostResponseDto updatedPost = postService.updatePostContent(
                postId, contentJSON, loggedInMemberId, isAdmin
        );
        return ResponseEntity.ok(updatedPost);
    }

    /**
     * 게시글 삭제 (소프트 삭제)
     *
     * @param id               삭제할 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID (Long 타입)
     * @param removedBy        삭제를 수행한 사용자 정보 (ADMIN 또는 작성자 이름)
     * @return 성공 상태 (200 OK)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Integer id,
            @RequestParam Long loggedInMemberId,
            @RequestParam String removedBy
    ) {
        postService.deletePost(id, loggedInMemberId, removedBy);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 하드 삭제 (관리자 전용)
     *
     * @param id               삭제할 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID (Long 타입, 관리자여야 함)
     * @return 성공 상태 (200 OK)
     */
    @DeleteMapping("/{id}/hard-delete")
    public ResponseEntity<Void> hardDeletePost(
            @PathVariable Integer id,
            @RequestParam Long loggedInMemberId
    ) {
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        postService.hardDeletePost(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 숨김 처리
     *
     * @param postId 숨길 게시글 ID
     * @return 성공 상태 (200 OK)
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
     * @return 성공 상태 (200 OK)
     */
    @PostMapping("/{postId}/restore")
    public ResponseEntity<Void> restorePost(@PathVariable Integer postId) {
        postService.restorePost(postId);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 수정 권한 확인
     *
     * @param id               게시글 ID
     * @param loggedInMemberId 요청 사용자 ID (Long 타입)
     * @return 게시글 수정 권한 여부
     */
    @GetMapping("/{id}/can-edit")
    public ResponseEntity<Boolean> canEditPost(
            @PathVariable Integer id,
            @RequestParam Long loggedInMemberId
    ) {
        boolean canEdit = postService.canEditPost(id, loggedInMemberId);
        return ResponseEntity.ok(canEdit);
    }

    /**
     * 게시글 삭제 권한 확인
     *
     * @param id               게시글 ID
     * @param loggedInMemberId 요청 사용자 ID (Long 타입)
     * @return 게시글 삭제 권한 여부
     */
    @GetMapping("/{id}/can-delete")
    public ResponseEntity<Boolean> canDeletePost(
            @PathVariable Integer id,
            @RequestParam Long loggedInMemberId
    ) {
        boolean canDelete = postService.canDeletePost(id, loggedInMemberId);
        return ResponseEntity.ok(canDelete);
    }

    /**
     * 특정 게시글 상세 조회
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
     * @return 성공 상태 (200 OK)
     */
    @PostMapping("/{id}/increment-view")
    public ResponseEntity<Void> incrementViewCount(@PathVariable Integer id) {
        postService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 게시글 인용
     *
     * @param quotingMemberId 인용하는 회원 ID (정수형으로 처리)
     * @param quotedPostId    인용 대상 게시글 ID
     * @param commentContent  추가 댓글 내용
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
     * @param postId     신고할 게시글 ID
     * @param reporterId 신고자 ID (정수형)
     * @param reason     신고 사유 (본문)
     * @return 신고 결과 (업데이트된 게시글 정보 포함)
     */
    @PostMapping("/{postId}/report")
    public ResponseEntity<ForumPostResponseDto> reportPost(
            @PathVariable Integer postId,
            @RequestParam Integer reporterId,
            @RequestBody String reason
    ) {
        ForumPostResponseDto responseDto = postService.reportPost(postId, reporterId.longValue(), reason);
        return ResponseEntity.ok(responseDto);
    }
}
