package com.kh.back.controller.forum;

import com.kh.back.dto.forum.request.ForumPostCommentRequestDto;
import com.kh.back.dto.forum.response.ForumPostCommentResponseDto;
import com.kh.back.service.forum.ForumPostCommentService;
import com.kh.back.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 댓글 컨트롤러 클래스
 * REST API 엔드포인트를 정의하고, Service 계층 호출
 */
@RestController
@RequestMapping("/api/forums/comments")
@RequiredArgsConstructor
@Slf4j
public class ForumPostCommentController {

    private final ForumPostCommentService commentService;
    private final MemberService memberService;

    /**
     * 특정 게시글의 댓글 목록 조회
     *
     * @param postId 게시글 ID
     * @return 댓글 리스트 (Response DTO)
     */
    @GetMapping("/{postId}")
    public ResponseEntity<List<ForumPostCommentResponseDto>> getCommentsForPost(@PathVariable Integer postId) {
        log.info("게시글 ID: {} 의 댓글 목록 조회", postId);
        List<ForumPostCommentResponseDto> comments = commentService.getCommentsForPost(postId);
        return ResponseEntity.ok(comments);
    }

    /**
     * 댓글 생성
     *
     * @param requestDto 댓글 생성 요청 DTO
     * @return 생성된 댓글 정보 (Response DTO)
     */
    @PostMapping
    public ResponseEntity<ForumPostCommentResponseDto> createComment(
            @RequestBody ForumPostCommentRequestDto requestDto) {
        log.info("게시글 ID: {} 에 댓글 생성 요청", requestDto.getPostId());
        ForumPostCommentResponseDto created = commentService.createComment(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 댓글 수정
     *
     * @param commentId        수정할 댓글 ID
     * @param requestDto       수정 요청 데이터
     * @param loggedInMemberId 요청 사용자 ID
     * @return 수정된 댓글 정보 (Response DTO)
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<ForumPostCommentResponseDto> updateComment(
            @PathVariable Integer commentId,
            @RequestBody ForumPostCommentRequestDto requestDto,
            @RequestParam Long loggedInMemberId) {

        log.info("댓글 ID: {} 수정 요청, 사용자 ID: {}", commentId, loggedInMemberId);
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        ForumPostCommentResponseDto updated = commentService.updateComment(commentId, requestDto, loggedInMemberId, isAdmin);
        return ResponseEntity.ok(updated);
    }

    /**
     * 댓글 숨김 처리
     *
     * @param commentId 숨길 댓글 ID
     */
    @PostMapping("/{commentId}/hide")
    public ResponseEntity<Void> hideComment(@PathVariable Integer commentId) {
        log.info("댓글 ID: {} 숨김 처리 요청", commentId);
        commentService.hideComment(commentId);
        return ResponseEntity.ok().build();
    }

    /**
     * 숨겨진 댓글 복구
     *
     * @param commentId 복구할 댓글 ID
     * @return 복구된 댓글 정보 (Response DTO)
     */
    @PostMapping("/{commentId}/restore")
    public ResponseEntity<ForumPostCommentResponseDto> restoreComment(@PathVariable Integer commentId) {
        log.info("댓글 ID: {} 복원 요청", commentId);
        ForumPostCommentResponseDto restored = commentService.restoreComment(commentId);
        return ResponseEntity.ok(restored);
    }

    /**
     * 댓글 삭제 (논리 삭제)
     *
     * @param commentId        삭제할 댓글 ID
     * @param loggedInMemberId 요청 사용자 ID
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Integer commentId,
            @RequestParam Long loggedInMemberId) {
        log.info("댓글 ID: {} 삭제 요청, 사용자 ID: {}", commentId, loggedInMemberId);
        commentService.deleteComment(commentId, loggedInMemberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 댓글 하드 삭제 (관리자 전용)
     *
     * @param commentId        삭제할 댓글 ID
     * @param loggedInMemberId 요청 사용자 ID (관리자여야 함)
     */
    @DeleteMapping("/{commentId}/hard-delete")
    public ResponseEntity<Void> hardDeleteComment(
            @PathVariable Integer commentId,
            @RequestParam Long loggedInMemberId
    ) {
        log.info("댓글 ID: {} 하드 삭제 요청, 관리자 사용자 ID: {}", commentId, loggedInMemberId);

        // isAdmin이 false면 예외 발생
        if (!memberService.isAdmin(loggedInMemberId)) {
            throw new SecurityException("관리자 권한이 없습니다."); // AccessDeniedException 등 사용 가능
        }

        commentService.hardDeleteComment(commentId);
        return ResponseEntity.ok().build();
    }

    /**
     * 댓글 신고
     *
     * @param commentId  신고 대상 댓글 ID
     * @param reporterId 신고자 ID
     * @param reason     신고 사유 (본문)
     * @return 신고된 댓글 정보 (Response DTO)
     */
    @PostMapping("/{commentId}/report")
    public ResponseEntity<ForumPostCommentResponseDto> reportComment(
            @PathVariable Integer commentId,
            @RequestParam Integer reporterId,
            @RequestBody String reason) {
        log.info("댓글 ID: {} 신고 요청, 신고자 ID: {}", commentId, reporterId);
        ForumPostCommentResponseDto reported = commentService.reportComment(commentId, reporterId, reason);
        return ResponseEntity.ok(reported);
    }

    /**
     * 댓글에 대한 답글 추가 (인용)
     *
     * @param commentId  부모 댓글 ID
     * @param requestDto 답글 요청 데이터
     * @return 생성된 답글 정보 (Response DTO)
     */
    @PostMapping("/{commentId}/reply")
    public ResponseEntity<ForumPostCommentResponseDto> replyToComment(
            @PathVariable Integer commentId,
            @RequestBody ForumPostCommentRequestDto requestDto) {
        log.info("부모 댓글 ID: {} 에 대한 답글 생성 요청", commentId);
        ForumPostCommentResponseDto reply = commentService.replyToComment(commentId, requestDto);
        return ResponseEntity.ok(reply);
    }

    /**
     * 게시글(OP)에 대한 답글 추가 (인용)
     *
     * @param postId     게시글 ID
     * @param requestDto 답글 요청 데이터
     * @return 생성된 답글 정보 (Response DTO)
     */
    @PostMapping("/post/{postId}/reply")
    public ResponseEntity<ForumPostCommentResponseDto> replyToPost(
            @PathVariable Integer postId,
            @RequestBody ForumPostCommentRequestDto requestDto) {
        log.info("게시글 ID: {} 에 대한 답글 생성 요청", postId);
        ForumPostCommentResponseDto reply = commentService.replyToPost(postId, requestDto);
        return ResponseEntity.ok(reply);
    }
}
