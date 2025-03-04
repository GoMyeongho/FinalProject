package com.kh.back.service.forum;

import com.kh.back.dto.forum.request.ForumPostCommentRequestDto;
import com.kh.back.dto.forum.response.ForumPostCommentResponseDto;
import com.kh.back.entity.forum.CommentReport;
import com.kh.back.entity.forum.ForumPost;
import com.kh.back.entity.forum.ForumPostComment;
import com.kh.back.entity.forum.ForumPostCommentHistory;
import com.kh.back.repository.forum.CommentReportRepository;
import com.kh.back.repository.forum.ForumPostCommentHistoryRepository;
import com.kh.back.repository.forum.ForumPostCommentRepository;
import com.kh.back.repository.forum.ForumPostRepository;
import com.kh.back.entity.Member;
import com.kh.back.repository.MemberRepository;
import com.kh.back.service.MemberService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j // 로그 기록을 위한 어노테이션 추가
public class ForumPostCommentService {

    private final ForumPostCommentRepository commentRepository; // 댓글 데이터베이스 접근 객체
    private final MemberRepository memberRepository;
    private final CommentReportRepository commentReportRepository;
    private final MemberService memberService;
    private final ForumPostCommentHistoryRepository commentHistoryRepository;
    private final ForumPostRepository postRepository;

    private static final int REPORT_THRESHOLD = 10; // 신고 누적 기준값

    /**
     * 특정 게시글에 포함된 댓글을 조회하고 DTO 리스트로 변환
     *
     * @param postId 게시글 ID
     * @return 댓글 응답 DTO 리스트
     */
    public List<ForumPostCommentResponseDto> getCommentsForPost(Integer postId) {
        log.info("Fetching comments for post ID: {}", postId);

        List<Integer> commentIds = commentRepository.findCommentIdsByPostId(postId);
        List<Object[]> rawReportCounts = commentReportRepository.countByCommentIds(commentIds);
        log.info("Raw report counts: {}", rawReportCounts);
        Map<Integer, Long> reportCounts = rawReportCounts.stream()
                .collect(Collectors.toMap(
                        obj -> ((Number) obj[0]).intValue(),
                        obj -> ((Number) obj[1]).longValue()
                ));
        log.info("Processed report counts: {}", reportCounts);

        return commentRepository.findCommentsByPostId(postId).stream()
                .map(comment -> ForumPostCommentResponseDto.builder()
                        .id(comment.getId())
                        .content(comment.getContent())
                        .contentJSON(comment.getContentJSON())
                        .authorName(comment.getMember().getName())
                        .memberId(comment.getMember().getId())
                        .likesCount(comment.getLikesCount())
                        .hidden(comment.getHidden())
                        .removedBy(comment.getRemovedBy())
                        .editedBy(comment.getEditedBy())
                        .locked(comment.getLocked())
                        .createdAt(comment.getCreatedAt())
                        .updatedAt(comment.getUpdatedAt())
                        .fileUrl(comment.getFileUrl())
                        .reportCount(reportCounts.getOrDefault(comment.getId(), 0L))
                        .hasReported(false) // 필요 시 세팅
                        // ★ 추가: 게시글 ID 설정
                        .postId(comment.getForumPost().getId())
                        .build()
                )
                .collect(Collectors.toList());
    }

    private String sanitizeHtml(String content) {
        if (content == null || content.isEmpty()) return content;

        // 🔽 로그: 원본 content 확인
        log.info("Sanitizing content (before): {}", content);

        /**
         * 1) 기본적인 'relaxed' 정책을 사용하되,
         * 2) 블록 인용 태그(<blockquote>) 또는 전체 태그(:all)에 대해 'class' 속성을 허용하도록 확장합니다.
         *
         * - Safelist.relaxed(): Jsoup가 제공하는 "relaxed" 기본 정책(여러 태그/속성 허용)
         * - .addAttributes("blockquote", "class"):
         *     blockquote 태그에 "class" 속성을 허용 (ex. class="reply-quote")
         * - 만약 모든 태그에 대해 class를 허용하려면 .addAttributes(":all", "class")를 사용
         */
        Safelist safelist = Safelist.relaxed()
                .addAttributes("blockquote", "class") // 또는 .addAttributes(":all", "class")
                .addAttributes("a", "href", "rel", "target")
                // 아래 한 줄 추가: "href"에서 "#" (앵커)도 허용
                .addProtocols("a", "href", "#", "http", "https", "mailto", "tel", "ftp");


        // <a> 태그에 href, rel, target 속성 허용 (기존 코드)

        /**
         * 3) Jsoup.clean(content, safelist)를 이용해 HTML을 세척(sanitize)
         *    -> 지정된 태그/속성 외에는 모두 제거
         */
        String sanitizedContent = Jsoup.clean(content, safelist);

        // 🔽 로그: 최종 세척 후 content 확인
        log.info("Sanitized content (after): {}", sanitizedContent);

        return sanitizedContent;
    }

    /**
     * 새로운 댓글 생성
     */
    @Transactional
    public ForumPostCommentResponseDto createComment(ForumPostCommentRequestDto requestDto) {
        log.info("Creating new comment for post ID: {} by member ID: {}", requestDto.getPostId(), requestDto.getMemberId());

        if (requestDto.getMemberId() == null) {
            throw new IllegalArgumentException("Member ID is null or invalid.");
        }
        ForumPost forumPost = postRepository.findById(requestDto.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + requestDto.getPostId()));
        Member commentAuthor = memberRepository.findById(requestDto.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid member ID: " + requestDto.getMemberId()));
        ForumPostComment parentComment = null;
        if (requestDto.getParentCommentId() != null) {
            parentComment = commentRepository.findById(requestDto.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid parent comment ID: " + requestDto.getParentCommentId()));
        }
        String sanitizedContent = sanitizeHtml(requestDto.getContent());
        log.info("Sanitized content: {}", sanitizedContent);
        ForumPostComment newComment = ForumPostComment.builder()
                .forumPost(forumPost)
                .member(commentAuthor)
                .content(sanitizedContent)
                .contentJSON(requestDto.getContentJSON())
                .parentComment(parentComment)
                .fileUrl(requestDto.getFileUrl())
                .likesCount(0)
                .hidden(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        ForumPostComment savedComment = commentRepository.save(newComment);

        // ★ 추가: set postId in the DTO
        return ForumPostCommentResponseDto.builder()
                .id(savedComment.getId())
                .content(savedComment.getContent())
                .contentJSON(savedComment.getContentJSON())
                .parentCommentId(parentComment != null ? parentComment.getId() : null)
                .parentContent(parentComment != null ? parentComment.getContent() : null)
                .memberId(commentAuthor.getId())
                .authorName(commentAuthor.getName())
                .likesCount(savedComment.getLikesCount())
                .hidden(savedComment.getHidden())
                .removedBy(savedComment.getRemovedBy())
                .createdAt(savedComment.getCreatedAt())
                .updatedAt(savedComment.getUpdatedAt())
                .fileUrl(savedComment.getFileUrl())
                .reportCount(commentReportRepository.countByCommentId(savedComment.getId()))
                .postId(savedComment.getForumPost().getId())
                .build();
    }


    /**
     * 댓글 수정 (JSON 콘텐츠 업데이트)
     * KR: 댓글 수정 시 HTML 콘텐츠는 무시하고, TipTap JSON 콘텐츠만 업데이트합니다.
     *
     * @param commentId 수정할 댓글 ID
     * @param requestDto 수정 요청 데이터 (TipTap JSON 내용 포함)
     * @param loggedInMemberId 요청 사용자 ID
     * @param isAdmin 관리자 여부
     * @return 수정된 댓글 응답 DTO
     */
    @Transactional
    public ForumPostCommentResponseDto updateComment(Integer commentId, ForumPostCommentRequestDto requestDto, Integer loggedInMemberId, boolean isAdmin) {
        log.info("Updating comment ID: {} by member ID: {}", commentId, loggedInMemberId);

        // KR: TipTap JSON은 필수입니다.
        if (requestDto.getContentJSON() == null || requestDto.getContentJSON().trim().isEmpty()) {
            throw new IllegalArgumentException("Content JSON must not be empty.");
        }

        ForumPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID: " + commentId));

        if (!isAdmin && !comment.getMember().getId().equals(loggedInMemberId)) {
            throw new SecurityException("You are not allowed to edit this comment.");
        }

        // KR: HTML 콘텐츠는 무시하고, JSON 콘텐츠만 업데이트합니다.
        comment.setContentJSON(requestDto.getContentJSON());
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setEditedBy(isAdmin ? "ADMIN" : comment.getMember().getName());
        if (isAdmin) {
            comment.setLocked(true);
        }

        ForumPostComment updatedComment = commentRepository.save(comment);

        // KR: 업데이트된 댓글의 응답 DTO를 생성하여 반환합니다.
        return ForumPostCommentResponseDto.builder()
                .id(updatedComment.getId())
                // KR: HTML 필드는 그대로 반환하나, 실제 렌더링은 JSON을 사용합니다.
                .content(updatedComment.getContent())
                .contentJSON(updatedComment.getContentJSON())
                .authorName(updatedComment.getMember().getName())
                .memberId(updatedComment.getMember().getId())
                .likesCount(updatedComment.getLikesCount())
                .hidden(updatedComment.getHidden())
                .removedBy(updatedComment.getRemovedBy())
                .editedBy(updatedComment.getEditedBy())
                .locked(updatedComment.getLocked())
                .createdAt(updatedComment.getCreatedAt())
                .updatedAt(updatedComment.getUpdatedAt())
                .fileUrl(updatedComment.getFileUrl())
                .reportCount(commentReportRepository.countByCommentId(updatedComment.getId()))
                // ★ 추가: 게시글 ID 설정
                .postId(updatedComment.getForumPost().getId())
                .build();
    }


    /**
     * 댓글에 대한 답글 추가
     *
     * @param parentCommentId 부모 댓글 ID
     * @param requestDto 답글 요청 데이터
     * @return 생성된 답글 정보 (ForumPostCommentResponseDto)
     */
    @Transactional
    public ForumPostCommentResponseDto replyToComment(Integer parentCommentId, ForumPostCommentRequestDto requestDto) {
        log.info("Replying to comment ID: {} by member ID: {}", parentCommentId, requestDto.getMemberId());

        // 부모 댓글 조회
        ForumPostComment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid parent comment ID: " + parentCommentId));

        // 답글 작성자 정보 조회
        Member replyAuthor = memberRepository.findById(requestDto.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid member ID: " + requestDto.getMemberId()));

        // 부모 댓글 내용을 포함한 답글 내용 생성
        String quotedContent = String.format("%s said: \"%s\"\n\n%s",
                parentComment.getMember().getName(), // 부모 댓글 작성자 이름
                parentComment.getContent(), // 부모 댓글 내용
                requestDto.getContent()); // 답글 내용

        // 답글 댓글 엔티티 생성
        ForumPostComment replyComment = ForumPostComment.builder()
                .forumPost(parentComment.getForumPost()) // 부모 댓글이 속한 게시글 정보
                .member(replyAuthor) // 답글 작성자 정보
                .content(quotedContent) // 답글 내용
                .likesCount(0) // 초기 좋아요 수
                .hidden(false) // 숨김 여부
                .locked(false) // 초기 잠금 상태
                .createdAt(LocalDateTime.now()) // 생성 시간
                .updatedAt(LocalDateTime.now()) // 수정 시간
                .build();

        // 데이터베이스에 답글 저장
        ForumPostComment savedReply = commentRepository.save(replyComment);

        // 응답 DTO 반환
        return ForumPostCommentResponseDto.builder()
                .id(savedReply.getId()) // 댓글 ID
                .content(savedReply.getContent()) // 댓글 내용
                .authorName(replyAuthor.getName()) // 작성자 이름
                .memberId(replyAuthor.getId()) // 작성자 ID
                .likesCount(savedReply.getLikesCount()) // 좋아요 수
                .hidden(savedReply.getHidden()) // 숨김 여부
                .locked(savedReply.getLocked()) // 잠금 상태 추가
                .createdAt(savedReply.getCreatedAt()) // 생성 시간
                .updatedAt(savedReply.getUpdatedAt()) // 수정 시간
                .fileUrl(savedReply.getFileUrl()) // 첨부 파일 URL
                // ★ 추가: 게시글 ID 설정 from parent comment
                .postId(savedReply.getForumPost().getId())
                .build();
    }



    /**
     * 게시글(OP)에 대한 답글 추가
     *
     * @param postId 게시글 ID
     * @param requestDto 답글 요청 데이터
     * @return 생성된 답글 정보 (ForumPostCommentResponseDto)
     */
    @Transactional
    public ForumPostCommentResponseDto replyToPost(Integer postId, ForumPostCommentRequestDto requestDto) {
        log.info("Replying to post ID: {} by member ID: {}", postId, requestDto.getMemberId());

        // 게시글 내용을 인용한 답글 내용 생성
        String quotedContent = String.format("%s (OP) said: \"%s\"\n\n%s",
                requestDto.getOpAuthorName(), // 게시글 작성자 이름
                requestDto.getOpContent(), // 게시글 내용
                requestDto.getContent()); // 답글 내용

        // 답글 댓글 엔티티 생성
        ForumPostComment replyComment = ForumPostComment.builder()
                .forumPost(ForumPost.builder().id(postId).build()) // 게시글 ID 매핑
                .member(Member.builder().id(requestDto.getMemberId()).build()) // 답글 작성자 ID 매핑
                .content(quotedContent) // 답글 내용
                .fileUrl(requestDto.getFileUrl()) // 첨부 파일 URL
                .likesCount(0) // 초기 좋아요 수
                .hidden(false) // 숨김 여부
                .locked(false) // 초기 잠금 상태
                .createdAt(LocalDateTime.now()) // 생성 시간
                .updatedAt(LocalDateTime.now()) // 수정 시간
                .build();

        // 데이터베이스에 답글 저장
        ForumPostComment savedReply = commentRepository.save(replyComment);

        // 응답 DTO 반환
        return ForumPostCommentResponseDto.builder()
                .id(savedReply.getId()) // 댓글 ID
                .content(savedReply.getContent()) // 댓글 내용
                .authorName(savedReply.getMember().getName()) // 작성자 이름
                .memberId(savedReply.getMember().getId()) // 작성자 ID
                .likesCount(savedReply.getLikesCount()) // 좋아요 수
                .hidden(savedReply.getHidden()) // 숨김 여부
                .locked(savedReply.getLocked()) // 잠금 상태 추가
                .createdAt(savedReply.getCreatedAt()) // 생성 시간
                .updatedAt(savedReply.getUpdatedAt()) // 수정 시간
                .fileUrl(savedReply.getFileUrl()) // 첨부 파일 URL
                // ★ 추가: 게시글 ID 설정 (use the postId parameter)
                .postId(postId)
                .build();
    }



    /**
     * 댓글 삭제 (히스토리 생성 포함)
     *
     * @param commentId 삭제할 댓글 ID
     * @param loggedInMemberId 요청 사용자 ID
     */
    @Transactional
    public void deleteComment(Integer commentId, Integer loggedInMemberId) {
        log.info("Deleting comment ID: {} by member ID: {}", commentId, loggedInMemberId);

        // 댓글 조회 / Fetch the comment
        ForumPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID: " + commentId));

        // 댓글 소유자 또는 관리자 권한 확인 / Check ownership or admin privileges
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        if (!comment.getMember().getId().equals(loggedInMemberId) && !isAdmin) {
            throw new IllegalArgumentException("You are not allowed to delete this comment.");
        }

        // 댓글 삭제 이력 기록 / Log deletion history
        ForumPostCommentHistory history = ForumPostCommentHistory.builder()
                .commentId(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getMember().getName())
                .deletedAt(LocalDateTime.now())
                .build();
        commentHistoryRepository.save(history);

        // 댓글 상태를 삭제됨으로 표시 / Mark the comment as deleted
        comment.setContent("[Removed]");
        comment.setHidden(true);
        if (isAdmin) {
            comment.setRemovedBy("ADMIN"); // 삭제자가 관리자임을 표시
        }
        commentRepository.save(comment);

        log.info("Comment ID: {} deleted and history recorded.", commentId);
    }

    /* ================================
     HARD 삭제 기능 추가 (댓글)
     ================================
     관리자 전용: 댓글을 데이터베이스에서 완전히 삭제합니다.
  */
    @Transactional
    public void hardDeleteComment(Integer commentId) {
        log.info("Hard deleting comment ID: {}", commentId);
        ForumPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID: " + commentId));
        commentRepository.delete(comment);
        log.info("Comment ID: {} has been hard deleted.", commentId);
    }

    /**
     * 댓글 신고
     *
     * @param commentId 신고 대상 댓글 ID
     * @param reporterId 신고자 ID
     * @param reason 신고 사유
     * @return ForumPostCommentResponseDto 업데이트된 댓글 정보 DTO
     */
    @Transactional
    public ForumPostCommentResponseDto reportComment(Integer commentId, Integer reporterId, String reason) {
        log.info("Reporting comment ID: {} by reporter ID: {}", commentId, reporterId);

        // 댓글 조회
        ForumPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID: " + commentId));

        // 자신의 댓글 신고 방지
        if (comment.getMember().getId().equals(reporterId)) {
            throw new IllegalArgumentException("You cannot report your own comment.");
        }

        // 중복 신고 방지
        boolean alreadyReported = commentReportRepository.existsByCommentIdAndReporterId(commentId, reporterId);
        if (alreadyReported) {
            throw new IllegalArgumentException("You have already reported this comment.");
        }

        // 신고 엔티티 생성 및 저장
        CommentReport report = CommentReport.builder()
                .forumPostComment(comment)
                .member(memberRepository.findById(reporterId)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid reporter ID: " + reporterId)))
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .build();
        commentReportRepository.save(report);

        // 신고 누적 확인
        long reportCount = commentReportRepository.countByCommentId(commentId);

        // 댓글 숨김 처리
        if (reportCount >= REPORT_THRESHOLD) {
            comment.setHidden(true);
            commentRepository.save(comment);
            log.info("Comment ID: {} has been hidden due to exceeding report threshold.", commentId);
        }

        // 업데이트된 댓글 정보 DTO로 반환
        return ForumPostCommentResponseDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .hidden(comment.isHidden())
                .reportCount(Long.valueOf(reportCount))
                .hasReported(commentReportRepository.existsByCommentIdAndReporterId(commentId, reporterId))
                .build();
    }


    /**
     * 댓글 숨김 처리
     * 특정 댓글을 숨김 상태로 설정
     *
     * @param commentId 숨길 댓글 ID
     */
    @Transactional
    public void hideComment(Integer commentId) {
        log.info("Hiding comment ID: {}", commentId);

        ForumPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID: " + commentId));

        comment.setHidden(true); // 숨김 상태로 설정
        commentRepository.save(comment);
        log.info("Comment ID: {} marked as hidden.", commentId);
    }

    // 댓글 복원 로직
    @Transactional
    public ForumPostCommentResponseDto restoreComment(Integer commentId) {
        log.info("Restoring comment ID: {}", commentId);

        ForumPostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid comment ID: " + commentId));

        ForumPostCommentHistory history = commentHistoryRepository.findTopByCommentIdOrderByDeletedAtDesc(commentId)
                .orElseThrow(() -> new IllegalArgumentException("No history found for comment ID: " + commentId));

        if (history.getContent() != null) {
            comment.setContent(history.getContent());
            comment.setHidden(false);
            comment.setRemovedBy(null);
            commentRepository.save(comment);
            log.info("Comment ID: {} successfully restored.", commentId);
        } else {
            throw new IllegalStateException("No valid history content for restoration.");
        }

        return ForumPostCommentResponseDto.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getMember().getName())
                .memberId(comment.getMember().getId())
                .likesCount(comment.getLikesCount())
                .hidden(comment.getHidden())
                .removedBy(comment.getRemovedBy())
                .editedBy(comment.getEditedBy())
                .locked(comment.getLocked())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .fileUrl(comment.getFileUrl())
                .reportCount(commentReportRepository.countByCommentId(comment.getId())) // Add reportCount
                // ★ 추가: 게시글 ID 설정
                .postId(comment.getForumPost().getId())
                .build();
    }

    /**
     * 특정 댓글의 삭제 히스토리 가져오기
     *
     * @param commentId 댓글 ID
     * @return 삭제 히스토리 리스트
     */
    @Transactional(readOnly = true)
    public List<ForumPostCommentHistory> getCommentHistory(Integer commentId) {
        log.info("Fetching history for comment ID: {}", commentId);
        return commentHistoryRepository.findAllByCommentId(commentId);
    }


    // 댓글 좋아요 수 증가
    @Transactional
    public void incrementCommentLikes(Integer commentId) {
        log.info("Incrementing likes for comment ID: {}", commentId); // 댓글 좋아요 증가 로그
        commentRepository.incrementLikes(commentId);
    }
}