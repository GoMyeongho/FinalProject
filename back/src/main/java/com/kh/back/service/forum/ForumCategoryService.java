package com.kh.back.service.forum;

import com.kh.back.dto.forum.response.ForumCategoryDto;
import com.kh.back.entity.forum.ForumCategory;
import com.kh.back.entity.forum.ForumPost;
import com.kh.back.repository.forum.ForumCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * ForumCategoryService
 * 포럼 카테고리 관련 비즈니스 로직 처리
 */
@Service
@RequiredArgsConstructor
@Slf4j // 로그 기록을 위한 어노테이션 추가
public class ForumCategoryService {
    private final ForumCategoryRepository categoryRepository; // 카테고리 데이터 접근을 위한 Repository

    // 미리 정의된 카테고리 리스트
    private static final List<ForumCategory> PREDEFINED_CATEGORIES = List.of(
            new ForumCategory(null, "자유게시판", "자유롭게 이야기하는 공간입니다.", null, null, new ArrayList<>()),
            new ForumCategory(null, "구인 / 구직 게시판", "구인/구직 관련 정보를 공유하는 공간입니다.", null, null, new ArrayList<>()),
            new ForumCategory(null, "학원 / 부트캠프 리뷰 게시판", "학원 및 부트캠프 리뷰를 공유하는 공간입니다.", null, null, new ArrayList<>()),
            new ForumCategory(null, "회사 리뷰 게시판", "회사 리뷰를 공유하는 공간입니다.", null, null, new ArrayList<>())
    );

    /**
     * 애플리케이션 시작 시 미리 정의된 카테고리를 DB에 로드
     */
    @PostConstruct
    private void initializeCategories() {
        log.info("Initializing predefined forum categories..."); // 로그 기록
        preloadCategories(); // 카테고리 사전 로드
    }

    /**
     * 미리 정의된 카테고리를 DB에 로드
     * 이미 존재하는 경우 생성을 생략
     */
    private void preloadCategories() {
        for (ForumCategory category : PREDEFINED_CATEGORIES) {
            categoryRepository.findByTitle(category.getTitle()) // 카테고리 제목으로 조회
                    .orElseGet(() -> {
                        category.setCreatedAt(LocalDateTime.now()); // 생성 시간 설정
                        category.setUpdatedAt(LocalDateTime.now()); // 수정 시간 설정
                        log.info("Creating category: {}", category.getTitle()); // 생성 로그
                        return categoryRepository.save(category); // 카테고리 저장
                    });
        }
    }

    /**
     * 모든 카테고리를 최신 수정 시간 순으로 가져오기
     *
     * @return ForumCategoryDto 리스트 (최신 수정 시간 순)
     */
    public List<ForumCategoryDto> getAllCategories() {
        log.info("Fetching all forum categories ordered by update time"); // 로그 기록

        // 최신 수정 시간 기준으로 정렬된 카테고리 가져오기
        return categoryRepository.findAllCategoriesOrderedByUpdateTime()
                .stream() // Stream으로 변환
                .map(category -> {
                    // 최신 게시글 가져오기
                    ForumPost latestPost = category.getPosts().stream()
                            .max(Comparator.comparing(ForumPost::getCreatedAt)) // 생성 시간 기준으로 최신 게시글 찾기
                            .orElse(null); // 게시글이 없으면 null

                    // ForumCategoryDto 생성 및 반환
                    return new ForumCategoryDto(
                            category.getId(), // 카테고리 ID
                            category.getTitle(), // 카테고리 제목
                            category.getDescription(), // 카테고리 설명
                            (int) categoryRepository.countPostsByCategoryId(category.getId()), // 게시글 수 (long -> int 캐스팅)
                            latestPost != null ? latestPost.getComments().size() : 0, // 최신 게시글의 댓글 수
                            category.getUpdatedAt(), // 카테고리 마지막 수정 시간
                            latestPost != null ? latestPost.getTitle() : null, // 최신 게시글 제목
                            latestPost != null ? latestPost.getAuthorName() : null, // 최신 게시글 작성자 이름
                            latestPost != null ? latestPost.getCreatedAt() : null // 최신 게시글 생성 시간
                    );
                })
                .collect(Collectors.toList()); // 리스트로 변환
    }


    /**
     * 특정 카테고리에 대한 최신 게시글 정보 가져오기
     *
     * @param categoryId 조회할 카테고리 ID
     * @return ForumCategoryDto (Optional)
     */
    public Optional<ForumCategoryDto> getCategoryWithLatestPost(Integer categoryId) {
        log.info("Fetching latest post for category ID: {}", categoryId); // 로그 기록

        // 카테고리와 최신 게시글 정보 매핑
        return categoryRepository.findById(categoryId).map(category -> {
            // 최신 게시글 가져오기 (최신 순으로 정렬된 첫 번째 게시글)
            ForumPost latestPost = categoryRepository.findLatestPostsByCategoryId(categoryId)
                    .stream()
                    .findFirst()
                    .orElse(null); // 게시글이 없을 경우 null

            // ForumCategoryDto 생성 및 반환
            return new ForumCategoryDto(
                    category.getId(), // 카테고리 ID
                    category.getTitle(), // 카테고리 제목
                    category.getDescription(), // 카테고리 설명
                    (int) categoryRepository.countPostsByCategoryId(categoryId), // 게시글 수 (long -> int 캐스팅)
                    latestPost != null ? latestPost.getComments().size() : 0, // 최신 게시글의 댓글 수
                    category.getUpdatedAt(), // 카테고리 최종 수정 시간
                    latestPost != null ? latestPost.getTitle() : null, // 최신 게시글 제목
                    latestPost != null ? latestPost.getAuthorName() : null, // 최신 게시글 작성자 이름
                    latestPost != null ? latestPost.getCreatedAt() : null // 최신 게시글 작성 시간
            );
        });
    }
}
