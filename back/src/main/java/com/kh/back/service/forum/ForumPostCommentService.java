package com.kh.back.service.forum;

import com.kh.back.dto.forum.request.ForumPostCommentRequestDto;
import com.kh.back.dto.forum.response.ForumPostCommentResponseDto;
import com.kh.back.service.MemberService;
import com.kh.back.service.python.ElasticService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForumPostCommentService {

    private final ElasticService elasticService; // ElasticSearch (Flask) 호출
    private final MemberService memberService;

    /**
     * 특정 게시글에 대한 댓글 리스트 조회
     * KR: ES의 /forum/post/{postId}/comments 엔드포인트를 호출하여 댓글 목록을 가져옵니다.
     */
    public List<ForumPostCommentResponseDto> getCommentsForPost(Integer postId) {
        log.info("게시글 ID: {} 의 댓글 조회 요청", postId);
        return elasticService.searchCommentsForPost(postId);
    }

    /**
     * 새로운 댓글 생성
     * KR: ElasticService를 호출하여 새로운 댓글을 생성합니다.
     */
    @Transactional
    public ForumPostCommentResponseDto createComment(ForumPostCommentRequestDto requestDto) {
        log.info("게시글 ID: {} 에 새로운 댓글 생성 요청", requestDto.getPostId());
        // 필요 시 HTML sanitize 처리 (여기서는 단순 통과)
        String sanitizedContent = requestDto.getContent();
        requestDto.setContent(sanitizedContent);
        return elasticService.createComment(requestDto);
    }

    /**
     * 댓글 수정 (TipTap JSON 콘텐츠 업데이트)
     * KR: ElasticService의 댓글 수정 엔드포인트를 호출합니다.
     */
    @Transactional
    public ForumPostCommentResponseDto updateComment(Integer commentId, ForumPostCommentRequestDto requestDto, Long loggedInMemberId, boolean isAdmin) {
        log.info("댓글 ID: {} 수정 요청, 사용자 ID: {}", commentId, loggedInMemberId);
        // 관리자인 경우 "ADMIN", 그렇지 않으면 사용자 ID를 문자열로 전달
        String editedBy = isAdmin ? "ADMIN" : loggedInMemberId.toString();
        return elasticService.updateComment(commentId, requestDto, editedBy, isAdmin);
    }

    /**
     * 댓글에 대한 답글 추가
     * KR: 부모 댓글 ID를 포함하여 답글을 생성합니다.
     */
    @Transactional
    public ForumPostCommentResponseDto replyToComment(Integer parentCommentId, ForumPostCommentRequestDto requestDto) {
        log.info("부모 댓글 ID: {} 에 대한 답글 생성 요청", parentCommentId);
        requestDto.setParentCommentId(parentCommentId);
        return elasticService.createComment(requestDto);
    }

    /**
     * 게시글에 대한 답글 추가
     * KR: 게시글에 대한 직접 답글은 parentCommentId 없이 생성됩니다.
     */
    @Transactional
    public ForumPostCommentResponseDto replyToPost(Integer postId, ForumPostCommentRequestDto requestDto) {
        log.info("게시글 ID: {} 에 대한 답글 생성 요청", postId);
        requestDto.setPostId(postId);
        requestDto.setParentCommentId(null);
        return elasticService.createComment(requestDto);
    }

    /**
     * 댓글 삭제 (소프트 삭제)
     * KR: ElasticService의 DELETE 엔드포인트를 호출하여 댓글을 논리 삭제합니다.
     */
    @Transactional
    public void deleteComment(Integer commentId, Long loggedInMemberId) {
        log.info("댓글 ID: {} 삭제 요청, 사용자 ID: {}", commentId, loggedInMemberId);
        elasticService.deleteComment(commentId, loggedInMemberId);
    }

    /**
     * 댓글 하드 삭제 (관리자 전용)
     * KR: ElasticService의 하드 삭제 엔드포인트를 호출합니다.
     */
    @Transactional
    public void hardDeleteComment(Integer commentId) {
        log.info("댓글 ID: {} 하드 삭제 요청", commentId);
        elasticService.hardDeleteComment(commentId);
    }

    /**
     * 댓글 신고 처리
     * KR: 신고 요청을 ElasticService에 전달하여 댓글 신고를 처리합니다.
     */
    @Transactional
    public ForumPostCommentResponseDto reportComment(Integer commentId, Integer reporterId, String reason) {
        log.info("댓글 ID: {} 신고 요청, 신고자 ID: {}", commentId, reporterId);
        return elasticService.reportComment(commentId, reporterId, reason);
    }

    /**
     * 댓글 숨김 처리
     * KR: 댓글 숨김 처리를 위해 ElasticService의 hideComment 메서드를 호출합니다.
     */
    @Transactional
    public void hideComment(Integer commentId) {
        log.info("댓글 ID: {} 숨김 처리 요청", commentId);
        elasticService.hideComment(commentId);
    }

    /**
     * 댓글 복원
     * KR: ElasticService의 복원 엔드포인트를 호출하여 댓글을 복원합니다.
     */
    @Transactional
    public ForumPostCommentResponseDto restoreComment(Integer commentId) {
        log.info("댓글 ID: {} 복원 요청", commentId);
        return elasticService.restoreComment(commentId);
    }

    /**
     * 댓글 좋아요 수 증가
     * KR: 댓글 좋아요 수 증가를 ElasticService를 통해 처리합니다.
     */
    @Transactional
    public void incrementCommentLikes(Integer commentId) {
        log.info("댓글 ID: {} 좋아요 증가 요청", commentId);
        elasticService.incrementCommentLikes(commentId);
    }
}
