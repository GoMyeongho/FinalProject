package com.kh.back.controller.forum;

import com.capstone.project.forum.dto.request.ForumPostCommentRequestDto;
import com.capstone.project.forum.dto.response.ForumPostCommentResponseDto;
import com.capstone.project.forum.service.ForumPostCommentService;
import com.capstone.project.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 댓글 컨트롤러 클래스
 * REST API 엔드포인트를 정의하고 Service 계층 호출
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
        return ResponseEntity.ok(commentService.getCommentsForPost(postId));
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
        log.info("Creating comment for post ID: {}", requestDto.getPostId());
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.createComment(requestDto));
    }

    /**
     * 댓글 수정
     *
     * @param commentId 수정할 댓글 ID
     * @param requestDto 수정 요청 데이터
     * @param loggedInMemberId 요청 사용자 ID
     * @return 수정된 댓글 정보 (Response DTO)
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<ForumPostCommentResponseDto> updateComment(
            @PathVariable Integer commentId,
            @RequestBody ForumPostCommentRequestDto requestDto,
            @RequestParam Integer loggedInMemberId) {

        log.info("Updating comment ID: {} by member ID: {}", commentId, loggedInMemberId);

        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        return ResponseEntity.ok(commentService.updateComment(commentId, requestDto, loggedInMemberId, isAdmin));
    }

    /**
     * 댓글 숨김 처리
     *
     * @param commentId 숨길 댓글 ID
     */
    @PostMapping("/{commentId}/hide")
    public ResponseEntity<Void> hideComment(@PathVariable Integer commentId) {
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
        return ResponseEntity.ok(commentService.restoreComment(commentId));
    }

    /**
     * 댓글 삭제 (논리 삭제)
     *
     * @param commentId 삭제할 댓글 ID
     * @param loggedInMemberId 요청 사용자 ID
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Integer commentId,
            @RequestParam Integer loggedInMemberId) {

        log.info("Deleting comment ID: {} by member ID: {}", commentId, loggedInMemberId);
        commentService.deleteComment(commentId, loggedInMemberId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 댓글 하드 삭제 (관리자 전용)
     *
     * @param commentId 삭제할 댓글 ID
     * @param loggedInMemberId 요청 사용자 ID (관리자여야 함)
     */
    @DeleteMapping("/{commentId}/hard-delete")
    public ResponseEntity<Void> hardDeleteComment(
            @PathVariable Integer commentId,
            @RequestParam Integer loggedInMemberId) {

        memberService.verifyAdmin(loggedInMemberId);
        commentService.hardDeleteComment(commentId);
        return ResponseEntity.ok().build();
    }

    /**
     * 댓글 신고
     *
     * @param commentId 신고 대상 댓글 ID
     * @param reporterId 신고자 ID
     * @param reason 신고 사유
     * @return 신고된 댓글 정보 (Response DTO)
     */
    @PostMapping("/{commentId}/report")
    public ResponseEntity<ForumPostCommentResponseDto> reportComment(
            @PathVariable Integer commentId,
            @RequestParam Integer reporterId,
            @RequestBody String reason) {

        return ResponseEntity.ok(commentService.reportComment(commentId, reporterId, reason));
    }

    /**
     * 댓글에 대한 답글 추가 (인용)
     *
     * @param commentId 부모 댓글 ID
     * @param requestDto 답글 요청 데이터
     * @return 생성된 답글 정보 (Response DTO)
     */
    @PostMapping("/{commentId}/reply")
    public ResponseEntity<ForumPostCommentResponseDto> replyToComment(
            @PathVariable Integer commentId,
            @RequestBody ForumPostCommentRequestDto requestDto) {

        return ResponseEntity.ok(commentService.replyToComment(commentId, requestDto));
    }

    /**
     * 게시글(OP)에 대한 답글 추가 (인용)
     *
     * @param postId 게시글 ID
     * @param requestDto 답글 요청 데이터
     * @return 생성된 답글 정보 (Response DTO)
     */
    @PostMapping("/post/{postId}/reply")
    public ResponseEntity<ForumPostCommentResponseDto> replyToPost(
            @PathVariable Integer postId,
            @RequestBody ForumPostCommentRequestDto requestDto) {

        return ResponseEntity.ok(commentService.replyToPost(postId, requestDto));
    }
}
