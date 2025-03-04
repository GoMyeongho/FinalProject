package com.kh.back.service.forum;

import com.kh.back.dto.forum.request.ForumPostRequestDto;
import com.kh.back.dto.forum.response.ForumPostCommentResponseDto;
import com.kh.back.dto.forum.response.ForumPostResponseDto;
import com.kh.back.dto.forum.response.PaginationDto;
import com.kh.back.repository.forum.ForumPostRepository;
import com.kh.back.repository.forum.ForumPostCommentRepository;
import com.kh.back.entity.forum.ForumPost;
import com.kh.back.repository.MemberRepository;
import com.kh.back.repository.forum.*;
import com.kh.back.service.MemberService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j // 로그 기록을 위한 어노테이션 추가
public class ForumPostService {
    private final ForumPostRepository postRepository; // 게시글 관련 데이터베이스 접근
    private final MemberRepository memberRepository; // 회원 데이터베이스 접근
    private final ForumCategoryRepository categoryRepository; // 카테고리 데이터베이스 접근
    private final ForumPostRepository forumPostRepository;
    private final ForumPostCommentRepository commentRepository; // 댓글 데이터베이스 접근
    private final ForumPostCommentHistoryRepository commentHistoryRepository;
    private final ForumPostHistoryRepository historyRepository; // 삭제 이력 관련 데이터베이스 접근
    private final PostReportRepository postReportRepository;
    private final MemberService memberService;

    private static final int REPORT_THRESHOLD = 10; // 신고 누적 기준값


    /**
     * 특정 게시글의 최신 댓글을 가져오는 메서드
     *
     * @param post 조회할 게시글 객체
     * @return 최신 댓글 객체 (없을 경우 null)
     */
    private ForumPostCommentResponseDto getLatestComment(ForumPost post) {
        return post.getComments().isEmpty() ? null :
                post.getComments().stream()
                        .sorted((c1, c2) -> c2.getCreatedAt().compareTo(c1.getCreatedAt())) // 최신 순 정렬
                        .findFirst()
                        .map(comment -> ForumPostCommentResponseDto.builder()
                                .id(comment.getId()) // 댓글 ID
                                .authorName(comment.getMember().getName()) // 댓글 작성자
                                .content(comment.getContent()) // 댓글 내용
                                .createdAt(comment.getCreatedAt()) // 댓글 작성 시간
                                .build())
                        .orElse(null);
    }


    /**
     * 특정 카테고리에 속한 게시글을 페이지네이션하여 가져오는 메서드
     *
     * @param categoryId 카테고리 ID
     * @param page 페이지 번호
     * @param size 페이지당 게시글 수
     * @return PaginationDto<ForumPostResponseDto> 페이지네이션된 게시글 응답 DTO
     */
    public PaginationDto<ForumPostResponseDto> getPostsByCategory(Integer categoryId, int page, int size) {
        log.info("Fetching posts for category ID: {}, page: {}, size: {}", categoryId, page, size);

        Pageable pageable = PageRequest.of(page, size); // 페이지 요청 객체 생성
        Page<ForumPost> postPage = postRepository.findPostsByCategory(categoryId, pageable); // DB에서 게시글 조회

        List<ForumPostResponseDto> postDtos = postPage.getContent()
                .stream()
                .map(post -> ForumPostResponseDto.builder()
                        .id(post.getId()) // 게시글 ID
                        .title(post.getTitle()) // 게시글 제목
                        .content(post.getContent()) // 게시글 내용
                        .memberId(post.getMember().getId()) // 작성자 ID
                        .authorName(post.getMember().getName()) // 작성자 이름
                        .sticky(post.getSticky()) // 고정 여부
                        .viewsCount(post.getViewsCount()) // 조회수
                        .likesCount(post.getLikesCount()) // 좋아요 수
                        .hidden(post.getHidden()) // 숨김 여부
                        .removedBy(post.getRemovedBy()) // 삭제된 경우 삭제자 정보
                        .latestComment(getLatestComment(post)) // 최신 댓글 추가
                        .createdAt(post.getCreatedAt()) // 생성 시간
                        .updatedAt(post.getUpdatedAt()) // 수정 시간
                        .build())
                .collect(Collectors.toList());

        return new PaginationDto<>(postDtos, postPage.getNumber(), postPage.getTotalPages(), postPage.getTotalElements());
    }

    private String sanitizeHtml(String content) {
        if (content == null || content.isEmpty()) return content;

        Safelist safelist = Safelist.relaxed()
                .addAttributes("blockquote", "class")
                .addAttributes("a", "href", "rel", "target")
                .addProtocols("a", "href", "#", "http", "https", "mailto", "tel", "ftp");

        return Jsoup.clean(content, safelist);
    }

    /**
     * 게시글 생성
     * KR: 새로운 게시글을 생성하며 HTML 콘텐츠와 Tiptap JSON 콘텐츠를 모두 저장합니다.
     *
     * @param requestDto 게시글 요청 DTO
     * @return 생성된 게시글 응답 DTO
     */
    @Transactional
    public ForumPostResponseDto createPost(ForumPostRequestDto requestDto) {
        log.info("Creating post with title: {}", requestDto.getTitle());
        log.info("requestDto.content (HTML): {}", requestDto.getContent());
        log.info("requestDto.contentJSON (raw): {}", requestDto.getContentJSON());

        // Validate member ID
        if (requestDto.getMemberId() == null) {
            throw new IllegalArgumentException("Member ID must not be null.");
        }

        // Validate category ID
        if (requestDto.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID must not be null.");
        }

        // Retrieve member and category
        var member = memberRepository.findById(requestDto.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid member ID: " + requestDto.getMemberId()));
        var category = categoryRepository.findById(requestDto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category ID: " + requestDto.getCategoryId()));

        String sanitizedContent = sanitizeHtml(requestDto.getContent());

        // Build the post entity, storing both HTML and JSON content
        var post = ForumPost.builder()
                .title(requestDto.getTitle())
                .content(sanitizedContent) // HTML content
                .contentJSON(requestDto.getContentJSON()) // Tiptap JSON content
                .sticky(requestDto.getSticky() != null ? requestDto.getSticky() : false)
                .viewsCount(0)
                .likesCount(0)
                .fileUrls(requestDto.getFileUrls() != null ? requestDto.getFileUrls() : new ArrayList<>())
                .hidden(false)
                .member(member)
                .forumCategory(category)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Save the post
        var savedPost = postRepository.save(post);

        log.info("Saved post ID: {}", savedPost.getId());
        log.info("Saved post content (HTML): {}", savedPost.getContent());
        log.info("Saved post contentJSON: {}", savedPost.getContentJSON());

        // Return the response DTO with JSON content included
        return ForumPostResponseDto.builder()
                .id(savedPost.getId())
                .title(savedPost.getTitle())
                .content(savedPost.getContent())
                .contentJSON(savedPost.getContentJSON()) // Include JSON content
                .memberId(member.getId())
                .authorName(member.getName())
                .sticky(savedPost.getSticky())
                .viewsCount(savedPost.getViewsCount())
                .likesCount(savedPost.getLikesCount())
                .hidden(savedPost.getHidden())
                .removedBy(savedPost.getRemovedBy())
                .createdAt(savedPost.getCreatedAt())
                .updatedAt(savedPost.getUpdatedAt())
                .build();
    }



    /**
     * 게시글 제목 수정
     *
     * @param postId           수정할 게시글 ID
     * @param title            새로운 제목
     * @param loggedInMemberId 요청 사용자 ID
     * @param isAdmin          관리자 여부
     * @return 수정된 게시글 응답 DTO
     */
    @Transactional
    public ForumPostResponseDto updatePostTitle(Integer postId, String title, Integer loggedInMemberId, boolean isAdmin) {
        log.info("Updating post title for ID: {}", postId);

        // 1. 게시글 조회
        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 게시글이 존재하지 않습니다: " + postId));
        log.info("Fetched post for title update: {}", post);

        // 2. 권한 검증
        if (!isAdmin && !post.getMember().getId().equals(loggedInMemberId)) {
            log.warn("Unauthorized attempt to update title by user ID: {}", loggedInMemberId);
            throw new SecurityException("이 게시글의 제목을 수정할 권한이 없습니다.");
        }

        // 3. 제목 업데이트
        log.info("Updating title from '{}' to '{}'", post.getTitle(), title);
        post.setTitle(title);
        post.setUpdatedAt(LocalDateTime.now());

        // 4. 수정자 정보 설정
        post.setEditedByTitle(isAdmin ? "ADMIN" : post.getMember().getName());

        // 5. 저장 및 DTO 반환
        var updatedPost = postRepository.save(post);
        log.info("Post title updated successfully. New post data: {}", updatedPost);

        return ForumPostResponseDto.builder()
                .id(updatedPost.getId())
                .title(updatedPost.getTitle())
                .content(updatedPost.getContent())
                .authorName(post.getMember().getName())
                .editedByTitle(updatedPost.getEditedByTitle())
                .editedByContent(updatedPost.getEditedByContent())
                .createdAt(updatedPost.getCreatedAt())
                .updatedAt(updatedPost.getUpdatedAt())
                .build();
    }


    /**
     * 게시글 내용 수정
     * KR: 게시글 내용을 수정하며 HTML 콘텐츠와 Tiptap JSON 콘텐츠를 모두 업데이트합니다.
     *
     * @param postId 수정할 게시글 ID
     * @param content 새로운 HTML 내용
     * @param contentJSON 새로운 Tiptap JSON 내용
     * @param loggedInMemberId 요청 사용자 ID
     * @param isAdmin 관리자 여부
     * @return 수정된 게시글 응답 DTO
     */
    /**
     * 게시글 내용 수정 (TipTap JSON 전용)
     * HTML 콘텐츠 대신 TipTap JSON만 업데이트합니다.
     *
     * @param postId 수정할 게시글 ID
     * @param contentJSON 새로운 TipTap JSON 내용 (문자열)
     * @param loggedInMemberId 요청 사용자 ID
     * @param isAdmin 관리자 여부
     * @return 수정된 게시글 응답 DTO
     */
    @Transactional
    public ForumPostResponseDto updatePostContent(Integer postId, String contentJSON, Integer loggedInMemberId, boolean isAdmin) {
        log.info("게시글 내용을 수정합니다. 게시글 ID: {} / 요청자 ID: {}", postId, loggedInMemberId);

        // 1. 게시글 조회
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 게시글이 존재하지 않습니다: " + postId));

        // 2. 권한 검증 (관리자 또는 본인)
        if (!isAdmin && !post.getMember().getId().equals(loggedInMemberId)) {
            log.warn("권한 없음: 사용자 {}는 게시글 수정 권한이 없습니다.", loggedInMemberId);
            throw new SecurityException("이 게시글의 내용을 수정할 권한이 없습니다.");
        }

        // 3. contentJSON 유효성 검사
        if (contentJSON == null || contentJSON.trim().isEmpty()) {
            throw new IllegalArgumentException("콘텐츠 JSON은 비어있을 수 없습니다.");
        }

        // 4. TipTap JSON 업데이트 (HTML은 그대로 유지하거나 서버 사이드에서 필요 시 변환)
        post.setContentJSON(contentJSON);
        post.setUpdatedAt(LocalDateTime.now());
        post.setEditedByContent(isAdmin ? "ADMIN" : post.getMember().getName());
        if (isAdmin) {
            post.setLocked(true);
        }

        ForumPost updatedPost = postRepository.save(post);
        log.info("게시글 내용 수정 완료: {}", updatedPost);

        // 5. 저장된 JSON을 클라이언트에 반환 (HTML은 그대로 반환)
        return ForumPostResponseDto.builder()
                .id(updatedPost.getId())
                .title(updatedPost.getTitle())
                .content(updatedPost.getContent()) // 필요 시 HTML 변환 가능
                .contentJSON(updatedPost.getContentJSON())
                .authorName(updatedPost.getMember().getName())
                .editedByContent(updatedPost.getEditedByContent())
                .createdAt(updatedPost.getCreatedAt())
                .updatedAt(updatedPost.getUpdatedAt())
                .build();
    }







    /**
     * 게시글 숨김 처리
     *
     * @param postId 숨길 게시글 ID
     */
    @Transactional
    public void hidePost(Integer postId) {
        log.info("Hiding post ID: {}", postId);
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));
        post.setHidden(true);
        postRepository.save(post);
        log.info("Post ID: {} has been marked as hidden.", postId);
    }

    /**
     * 게시글 복구
     * 삭제된 게시글을 삭제 이력을 사용하여 복구
     *
     * @param postId 복구할 게시글 ID
     */
    @Transactional
    public void restorePost(Integer postId) {
        log.info("Restoring post ID: {}", postId);

        // 게시글 조회
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // 삭제된 상태 확인
        if (!"[Deleted]".equals(post.getTitle())) {
            throw new IllegalStateException("The post is not in a deleted state.");
        }

        // 삭제 이력 조회
        ForumPostHistory history = historyRepository.findTopByPostIdOrderByDeletedAtDesc(postId)
                .orElseThrow(() -> new IllegalArgumentException("No history found for post ID: " + postId));

        // 게시글 복구
        post.setTitle(history.getTitle()); // 제목 복구
        post.setContent(history.getContent()); // 내용 복구
        post.setHidden(false); // 숨김 해제
        post.setRemovedBy(null); // 삭제자 정보 초기화
        postRepository.save(post); // 저장

        log.info("Post ID: {} successfully restored.", postId);
    }



    /**
     * 게시글 삭제
     * 게시글을 삭제 상태로 표시하며, 삭제 이력을 기록합니다.
     *
     * @param postId         삭제할 게시글 ID
     * @param loggedInMemberId 삭제 요청을 보낸 사용자 ID
     * @param removedBy      삭제를 수행한 사용자 정보 (ADMIN 또는 작성자 이름)
     * @throws IllegalArgumentException 유효하지 않은 게시글 ID 또는 권한이 없는 사용자일 경우 예외 발생
     * @throws AccessDeniedException    삭제 권한이 없는 사용자가 요청할 경우 예외 발생
     */
    @Transactional
    public void deletePost(Integer postId, Integer loggedInMemberId, String removedBy) {
        log.info("Deleting post ID: {} by member ID: {}", postId, loggedInMemberId);

        // 1. 게시글 조회 / Fetch the post
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // 2. 삭제 권한 확인 / Validate deletion permissions
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        if (!post.getMember().getId().equals(loggedInMemberId) && !isAdmin) {
            throw new AccessDeniedException("You are not allowed to delete this post.");
        }

        // 3. 댓글 백업 수행 (삭제하지 않음) / Backup comments
        for (ForumPostComment comment : post.getComments()) {
            ForumPostCommentHistory history = ForumPostCommentHistory.builder()
                    .commentId(comment.getId())
                    .content(comment.getContent())
                    .authorName(comment.getMember().getName())
                    .deletedAt(LocalDateTime.now())
                    .build();
            commentHistoryRepository.save(history);
            log.info("Comment ID: {} backed up to history.", comment.getId());
        }

        // 4. 게시글 삭제 이력 저장 / Log post deletion history
        ForumPostHistory postHistory = ForumPostHistory.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .authorName(post.getMember().getName())
                .deletedAt(LocalDateTime.now())
                .build();
        historyRepository.save(postHistory);
        log.info("Post ID: {} backed up to history.", postId);

        // 5. 게시글 상태를 삭제됨으로 업데이트 / Mark post as deleted
        post.setTitle("[Deleted]");
        post.setContent("This post has been deleted.");
        post.setRemovedBy(isAdmin ? "ADMIN" : post.getMember().getName());
        post.setHidden(true);
        postRepository.save(post);

        log.info("Post ID: {} marked as deleted.", postId);
    }

    /* ========================
       HARD 삭제 기능 추가
       ========================
       아래의 메서드들은 관리자 전용으로,
       게시글 및 관련 댓글들을 완전히 삭제(하드 삭제)합니다.
    */

    /**
     * 게시글 하드 삭제
     * 관리자만 호출할 수 있으며, 게시글을 데이터베이스에서 완전히 삭제합니다.
     *
     * @param postId 삭제할 게시글 ID
     */
    @Transactional
    public void hardDeletePost(Integer postId) {
        log.info("Hard deleting post ID: {}", postId);
        // 게시글 조회
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));
        // 필요시 연관된 댓글들도 cascade 삭제 처리되어야 함
        postRepository.delete(post);
        log.info("Post ID: {} has been hard deleted.", postId);
    }

    /**
     * 게시글 수정 권한 확인
     *
     * @param postId 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @return 게시글을 수정할 권한이 있는지 여부
     */
    public boolean canEditPost(Integer postId, Integer loggedInMemberId) {
        log.info("Checking edit permissions for post ID: {} by member ID: {}", postId, loggedInMemberId);

        // 게시글 조회
        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // 수정 권한 확인
        boolean canEdit = post.getMember().getId().equals(loggedInMemberId);
        log.info("Member ID: {} has edit permissions: {}", loggedInMemberId, canEdit);
        return canEdit;
    }

    /**
     * 게시글 삭제 권한 확인
     *
     * @param postId 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @return 게시글을 삭제할 권한이 있는지 여부
     */
    public boolean canDeletePost(Integer postId, Integer loggedInMemberId) {
        log.info("Checking delete permissions for post ID: {} by member ID: {}", postId, loggedInMemberId);

        // 게시글 조회
        var post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // 삭제 권한 확인
        boolean canDelete = post.getMember().getId().equals(loggedInMemberId);
        log.info("Member ID: {} has delete permissions: {}", loggedInMemberId, canDelete);
        return canDelete;
    }


    /**
     * 게시글 상세 조회
     *
     * @param postId 게시글 ID
     * @return Optional<ForumPostResponseDto> 게시글 상세 정보
     */
    public Optional<ForumPostResponseDto> getPostDetails(Integer postId) {
        // 1. 로그 기록: 게시글 ID를 기반으로 세부 정보를 가져오는 작업 시작
        log.info("Fetching details for post ID: {}", postId);

        // 2. 게시글을 데이터베이스에서 조회 후, ForumPostResponseDto 형태로 매핑
        return postRepository.findById(postId)
                .map(post -> {
                            log.info("Fetched post content (HTML): {}", post.getContent());
                            log.info("Fetched post contentJSON: {}", post.getContentJSON());


                        return ForumPostResponseDto.builder()
                        .id(post.getId()) // 게시글 ID 설정
                        .title(post.getTitle()) // 게시글 제목 설정
                        .content(post.getContent()) // 게시글 내용 설정
                        .memberId(post.getMember().getId()) // 작성자 ID 설정
                        .authorName(post.getMember().getName()) // 작성자 이름 설정
                        .sticky(post.getSticky()) // 상단 고정 여부 설정
                        .viewsCount(post.getViewsCount()) // 조회수 설정
                        .likesCount(post.getLikesCount()) // 좋아요 수 설정
                        .hidden(post.getHidden()) // 숨김 여부 설정
                        .removedBy(post.getRemovedBy()) // 삭제자 정보 설정 (있다면)
                        .editedByTitle(post.getEditedByTitle()) // 제목 수정자 정보 설정
                        .editedByContent(post.getEditedByContent()) // 내용 수정자 정보 설정
                        .editedTitleByAdmin("ADMIN".equals(post.getEditedByTitle())) // 제목 수정자가 ADMIN인지 확인하고 설정
                        .editedContentByAdmin("ADMIN".equals(post.getEditedByContent())) // 내용 수정자가 ADMIN인지 확인하고 설정
                        .createdAt(post.getCreatedAt()) // 게시글 생성 시간 설정
                        .updatedAt(post.getUpdatedAt()) // 게시글 수정 시간 설정
                        .fileUrls(post.getFileUrls()) // 첨부 파일 URL 목록 설정
                        .reportCount(post.getReportCount()) // 신고 횟수 설정 (새롭게 추가)
                        .build();// ForumPostResponseDto 객체 빌드
                });
    }




    /**
     * 게시글 조회수 증가
     * @param postId 게시글 ID
     */
    @Transactional
    public void incrementViewCount(Integer postId) {
        log.info("Incrementing view count for post ID: {}", postId);
        postRepository.incrementViews(postId);
    }


    /**
     * 게시글 인용
     *
     * @param quotingMemberId 인용하는 회원 ID
     * @param quotedPostId    인용할 게시글 ID
     * @param commentContent  추가 댓글 내용
     * @return 생성된 인용 게시글의 응답 DTO
     */
    @Transactional
    public ForumPostResponseDto quotePost(Integer quotingMemberId, Integer quotedPostId, String commentContent) {
        log.info("Quoting post ID: {} by member ID: {}", quotedPostId, quotingMemberId);

        // 인용 대상 게시글 조회
        ForumPost quotedPost = postRepository.findById(quotedPostId)
                .orElseThrow(() -> new IllegalArgumentException("Quoted post not found"));

        // 숨김 또는 삭제된 게시글 검증
        if (quotedPost.getHidden() || quotedPost.getRemovedBy() != null) {
            throw new IllegalStateException("Cannot quote a hidden or deleted post.");
        }

        // 인용 내용 생성
        String quotedText = String.format(
                "<blockquote><strong>%s</strong> wrote:<br><em>%s</em></blockquote><p>%s</p>",
                quotedPost.getMember().getName(), // 인용한 작성자 이름
                quotedPost.getContent(), // 인용한 게시글 내용
                commentContent // 추가 내용
        );

        // 인용 게시글 작성자 확인
        var quotingMember = memberRepository.findById(quotingMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid quoting member ID"));

        // 새 인용 게시글 생성
        var quotedPostEntity = ForumPost.builder()
                .title("Reply to: " + quotedPost.getTitle()) // 제목 설정
                .content(quotedText) // 내용 설정
                .member(quotingMember) // 작성자 매핑
                .forumCategory(quotedPost.getForumCategory()) // 카테고리 매핑
                .createdAt(LocalDateTime.now()) // 생성 시간 설정
                .updatedAt(LocalDateTime.now()) // 수정 시간 초기화
                .build();

        // DB에 저장
        ForumPost savedPost = postRepository.save(quotedPostEntity);

        // 응답 DTO 생성
        return ForumPostResponseDto.builder()
                .id(savedPost.getId())
                .title(savedPost.getTitle())
                .content(savedPost.getContent())
                .authorName(savedPost.getMember().getName())
                .sticky(savedPost.getSticky())
                .viewsCount(savedPost.getViewsCount())
                .likesCount(savedPost.getLikesCount())
                .hidden(savedPost.getHidden())
                .removedBy(savedPost.getRemovedBy())
                .createdAt(savedPost.getCreatedAt())
                .updatedAt(savedPost.getUpdatedAt())
                .build();
    }

    /**
     * 게시글 신고 처리
     *
     * @param postId 신고할 게시글 ID
     * @param reporterId 신고자 ID
     * @param reason 신고 사유
     * @return ForumPostResponseDto 업데이트된 게시글 정보 DTO
     */
    @Transactional
    public ForumPostResponseDto reportPost(Integer postId, Integer reporterId, String reason) {
        log.info("Reporting post ID: {} by reporter ID: {}", postId, reporterId);

        // 게시글 존재 여부 확인
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid post ID: " + postId));

        // 자신의 게시글 신고 방지
        if (post.getMember().getId().equals(reporterId)) {
            throw new IllegalArgumentException("You cannot report your own post.");
        }

        // 중복 신고 방지
        boolean alreadyReported = postReportRepository.existsByPostIdAndReporterId(postId, reporterId);
        if (alreadyReported) {
            throw new IllegalArgumentException("You have already reported this post.");
        }

        // 신고 엔티티 생성 및 저장
        PostReport report = PostReport.builder()
                .forumPost(post)
                .reporterId(reporterId)
                .reason(reason)
                .createdAt(LocalDateTime.now())
                .build();
        postReportRepository.save(report);

        // 신고 횟수 증가
        post.incrementReportCount(); // 게시글 엔티티의 신고 횟수 증가
        log.info("Post ID: {} now has {} reports.", postId, post.getReportCount());

        // 신고 임계값 초과 시 게시글 숨김 처리
        if (post.getReportCount() >= REPORT_THRESHOLD) { // REPORT_THRESHOLD: 숨김 기준
            post.setHidden(true); // 게시글 숨김 상태 설정
            log.info("Post ID: {} has been hidden due to exceeding report threshold.", postId);
        }

        postRepository.save(post); // 업데이트된 게시글 저장

        // 업데이트된 게시글 데이터 DTO로 반환
        return ForumPostResponseDto.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .hidden(post.isHidden())
                .reportCount(post.getReportCount()) // 누적 신고 횟수
                .hasReported(postReportRepository.existsByPostIdAndReporterId(postId, reporterId))
                .build();
    }



    /**
     * 파일 저장
     * @param file 업로드할 파일
     * @return 저장된 파일 URL
     */
    private String saveFile(MultipartFile file) {
        log.info("Saving file: {}", file.getOriginalFilename());
        return "http://localhost/files/" + file.getOriginalFilename(); // 로컬 저장 예제
    }
}
