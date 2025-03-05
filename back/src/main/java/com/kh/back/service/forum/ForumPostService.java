package com.kh.back.service.forum;

import com.kh.back.dto.forum.request.ForumPostRequestDto;
import com.kh.back.dto.forum.response.ForumPostCommentResponseDto;
import com.kh.back.dto.forum.response.ForumPostResponseDto;
import com.kh.back.dto.forum.response.PaginationDto;
import com.kh.back.dto.python.SearchListResDto;
import com.kh.back.dto.python.SearchResDto;
import com.kh.back.service.MemberService;
import com.kh.back.service.python.ElasticService; // hypothetical service that calls ES or Flask
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * ForumPostService (ElasticSearch 기반)
 * KR: 기존 JPA Repository를 사용하지 않고, ElasticService(또는 App.py) 엔드포인트를 호출하여
 *     게시글 관련 CRUD 및 기타 로직을 수행합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ForumPostService {

    // 기존: private final ForumPostRepository postRepository;  // 삭제
    // ...
    // 대체: ElasticService, MemberService 등
    private final ElasticService elasticService;  // hypothetical service that calls /forum endpoints
    private final MemberService memberService;

    private static final int REPORT_THRESHOLD = 10; // 신고 누적 기준값

    /**
     * HTML 내용 Sanitizing 메서드
     * KR: 기존 코드 그대로 유지
     */
    private String sanitizeHtml(String content) {
        if (content == null || content.isEmpty()) return content;
        Safelist safelist = Safelist.relaxed()
                .addAttributes("blockquote", "class")
                .addAttributes("a", "href", "rel", "target")
                .addProtocols("a", "href", "#", "http", "https", "mailto", "tel", "ftp");
        return Jsoup.clean(content, safelist);
    }

    /**
     * [게시글 생성]
     * KR: ForumPostRequestDto를 받아, HTML/JSON 콘텐츠를 Sanitizing 후
     *     ElasticService를 호출하여 ES에 게시글을 생성합니다.
     */
    @Transactional
    public ForumPostResponseDto createPost(ForumPostRequestDto requestDto) {
        log.info("Creating post with title: {}", requestDto.getTitle());

        // 1) Validate: 회원 ID와 카테고리 ID는 필수입니다.
        if (requestDto.getMemberId() == null) {
            throw new IllegalArgumentException("Member ID must not be null.");
        }
        if (requestDto.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID must not be null.");
        }

        // 2) Sanitize HTML content
        String sanitizedContent = sanitizeHtml(requestDto.getContent());
        requestDto.setContent(sanitizedContent);

        // 3) ElasticService를 호출하여 ES에 게시글 생성 (Flask의 /forum/post 엔드포인트)
        ForumPostResponseDto createdDto = elasticService.createPost(requestDto);
        log.info("Post created in ES. ID: {}", createdDto.getId());
        return createdDto;
    }

    /**
     * [카테고리별 게시글 조회 + 페이지네이션]
     * KR: 기존에는 JPA의 PageRequest를 사용했으나, ES에서는 from/size 파라미터를 사용.
     *     ElasticService.search(...)를 통해 type="forum"으로 검색 + 카테고리 필터를 적용.
     */
    public PaginationDto<ForumPostResponseDto> getPostsByCategory(Integer categoryId, int page, int size) {
        log.info("Fetching posts for category ID: {}, page: {}, size: {}", categoryId, page, size);
        String categoryStr = categoryId != null ? categoryId.toString() : "";
        List<SearchListResDto> rawResults = elasticService.search("", "forum", categoryStr, page, size);

        if (rawResults == null) {
            return new PaginationDto<>(List.of(), page, 0, 0L);
        }

        List<ForumPostResponseDto> postList = new ArrayList<>();
        for (SearchListResDto item : rawResults) {
            if (item instanceof ForumPostResponseDto) {
                postList.add((ForumPostResponseDto) item);
            }
        }
        int totalPages = 1;        // dummy 값; ES totalHits를 활용하도록 개선 필요
        long totalElements = postList.size(); // dummy 값

        return new PaginationDto<>(postList, page, totalPages, totalElements);
    }


    /**
     * [게시글 상세 조회]
     * KR: 기존 JPA -> findById => now we do ES calls or "detail" endpoint.
     *  ElasticService의 detail 메서드를 호출하여 게시글 상세 정보를 가져옵니다.
     */
    public Optional<ForumPostResponseDto> getPostDetails(Integer postId) {
        log.info("Fetching details for post ID: {}", postId);
        SearchResDto rawDto = elasticService.detail(String.valueOf(postId), "forum");
        if (rawDto == null || !(rawDto instanceof ForumPostResponseDto)) return Optional.empty();
        return Optional.of((ForumPostResponseDto) rawDto);
    }

    /**
     * [게시글 제목 수정]
     * KR: App.py 또는 ES의 /forum/post/{postId}/title 엔드포인트를 호출하여 제목과 수정자 정보를 업데이트합니다.
     */
    @Transactional
    public ForumPostResponseDto updatePostTitle(Integer postId, String title, Long loggedInMemberId, boolean isAdmin) {
        log.info("Updating post title for ID: {}", postId);

        ForumPostResponseDto existing = getPostDetails(postId).orElseThrow(
                () -> new IllegalArgumentException("해당 ID의 게시글이 존재하지 않습니다: " + postId)
        );
        if (!isAdmin && !existing.getMemberId().equals(loggedInMemberId)) {
            throw new SecurityException("이 게시글의 제목을 수정할 권한이 없습니다.");
        }
        ForumPostResponseDto updated = elasticService.updatePostTitle(postId, title, isAdmin ? "ADMIN" : existing.getAuthorName());
        return updated;
    }

    /**
     * [게시글 내용 수정 (TipTap JSON)]
     * KR: ES의 /forum/post/{postId}/content 엔드포인트를 호출하여 contentJSON 필드를 업데이트합니다.
     */
    @Transactional
    public ForumPostResponseDto updatePostContent(Integer postId, String contentJSON, Long loggedInMemberId, boolean isAdmin) {
        log.info("게시글 내용을 수정합니다. 게시글 ID: {} / 요청자 ID: {}", postId, loggedInMemberId);

        ForumPostResponseDto existing = getPostDetails(postId).orElseThrow(
                () -> new IllegalArgumentException("해당 ID의 게시글이 존재하지 않습니다: " + postId)
        );
        if (!isAdmin && !existing.getMemberId().equals(loggedInMemberId)) {
            throw new SecurityException("이 게시글의 내용을 수정할 권한이 없습니다.");
        }
        if (contentJSON == null || contentJSON.trim().isEmpty()) {
            throw new IllegalArgumentException("콘텐츠 JSON은 비어있을 수 없습니다.");
        }
        ForumPostResponseDto updated = elasticService.updatePostContent(postId, contentJSON, isAdmin ? "ADMIN" : existing.getAuthorName(), isAdmin);
        return updated;
    }

    /**
     * [게시글 삭제 (소프트 삭제)]
     * KR: 권한 확인 후, ES의 /forum/post/{doc_id} DELETE 엔드포인트를 호출하여 게시글을 논리 삭제합니다.
     */
    @Transactional
    public void deletePost(Integer postId, Long loggedInMemberId, String removedBy) {
        log.info("Deleting post ID: {} by member ID: {}", postId, loggedInMemberId);

        ForumPostResponseDto existing = getPostDetails(postId).orElseThrow(
                () -> new IllegalArgumentException("Invalid post ID: " + postId)
        );
        boolean isAdmin = memberService.isAdmin(loggedInMemberId);
        if (!existing.getMemberId().equals(loggedInMemberId) && !isAdmin) {
            throw new AccessDeniedException("You are not allowed to delete this post.");
        }
        elasticService.deletePost(postId, removedBy);
        log.info("Post ID: {} marked as deleted in ES.", postId);
    }

    /**
     * [게시글 하드 삭제 (관리자)]
     * KR: 관리자 전용. App.py의 /forum/post/{doc_id}/hard-delete 같은 endpoint를 호출
     */
    @Transactional
    public void hardDeletePost(Integer postId) {
        log.info("Hard deleting post ID: {}", postId);
        elasticService.hardDeletePost(postId);  // hypothetical method
        log.info("Post ID: {} has been hard deleted in ES.", postId);
    }

    /**
     * [게시글 신고 처리]
     */
    @Transactional
    public ForumPostResponseDto reportPost(Integer postId, Long reporterId, String reason) {
        log.info("Reporting post ID: {} by reporter ID: {}", postId, reporterId);
        ForumPostResponseDto existing = getPostDetails(postId).orElseThrow(
                () -> new IllegalArgumentException("Invalid post ID: " + postId)
        );
        if (existing.getMemberId().equals(reporterId)) {
            throw new IllegalArgumentException("You cannot report your own post.");
        }
        ForumPostResponseDto updated = elasticService.reportPost(postId, reporterId.intValue(), reason);
        return updated;
    }

    /**
     * [게시글 숨김 처리]
     */
    @Transactional
    public void hidePost(Integer postId) {
        log.info("Hiding post ID: {}", postId);
        // e.g. elasticService.hidePost(postId)
        elasticService.hidePost(postId);
    }

    /**
     * [게시글 복구]
     * KR: 논리 삭제된 게시글을 복원
     */
    @Transactional
    public void restorePost(Integer postId) {
        log.info("Restoring post ID: {}", postId);
        // e.g. elasticService.restorePost(postId)
        elasticService.restorePost(postId);
    }

    /**
     * [조회수 증가]
     */
    @Transactional
    public void incrementViewCount(Integer postId) {
        log.info("Incrementing view count for post ID: {}", postId);
        // e.g. elasticService.incrementViewCount(postId)
        elasticService.incrementViewCount(postId);
    }

    /**
     * [인용 게시글 생성]
     * KR: quotingMemberId가 다른 게시글을 인용해 새 게시글을 생성합니다.
     */
    @Transactional
    public ForumPostResponseDto quotePost(Integer quotingMemberId, Integer quotedPostId, String commentContent) {
        log.info("Quoting post ID: {} by member ID: {}", quotedPostId, quotingMemberId);
        ForumPostResponseDto quoted = getPostDetails(quotedPostId).orElseThrow(
                () -> new IllegalArgumentException("Quoted post not found")
        );
        if (quoted.getHidden() || quoted.getRemovedBy() != null) {
            throw new IllegalStateException("Cannot quote a hidden or deleted post.");
        }
        String quotedText = String.format(
                "<blockquote><strong>%s</strong> wrote:<br><em>%s</em></blockquote><p>%s</p>",
                quoted.getAuthorName(),
                quoted.getContent(),
                commentContent
        );
        ForumPostRequestDto newPost = ForumPostRequestDto.builder()
                .memberId(Long.valueOf(quotingMemberId))
                .categoryId(null) // 필요 시 quoted의 카테고리 사용
                .title("Reply to: " + quoted.getTitle())
                .content(quotedText)
                .contentJSON(null)
                .sticky(false)
                .build();
        ForumPostResponseDto saved = createPost(newPost);
        return saved;
    }

    /**
     * [게시글 수정/삭제 권한 체크]
     * KR: 게시글 수정/삭제 권한은 게시글 작성자와 관리자만 허용합니다.
     */
    public boolean canEditPost(Integer postId, Long loggedInMemberId) {
        log.info("Checking edit permissions for post ID: {} by member ID: {}", postId, loggedInMemberId);
        ForumPostResponseDto existing = getPostDetails(postId).orElseThrow(
                () -> new IllegalArgumentException("Invalid post ID: " + postId)
        );
        return existing.getMemberId().equals(loggedInMemberId);
    }

    public boolean canDeletePost(Integer postId, Long loggedInMemberId) {
        log.info("Checking delete permissions for post ID: {} by member ID: {}", postId, loggedInMemberId);
        ForumPostResponseDto existing = getPostDetails(postId).orElseThrow(
                () -> new IllegalArgumentException("Invalid post ID: " + postId)
        );
        return existing.getMemberId().equals(loggedInMemberId);
    }

    /**
     * [파일 저장 - optional]
     * KR: 파일 저장 기능은 선택 사항이며, 로컬 파일 서버 URL을 반환합니다.
     */
    private String saveFile(MultipartFile file) {
        log.info("Saving file: {}", file.getOriginalFilename());
        return "http://localhost/files/" + file.getOriginalFilename();
    }
}
