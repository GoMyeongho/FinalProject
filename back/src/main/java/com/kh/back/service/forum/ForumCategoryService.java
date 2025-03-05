package com.kh.back.service.forum;

import com.kh.back.dto.forum.response.ForumCategoryDto;
import com.kh.back.service.python.ElasticService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Optional;

/**
 * ForumCategoryService
 * <p>
 * KR: 포럼 카테고리 관련 비즈니스 로직 처리.
 *     이 예시에서는 ElasticSearch에 인덱싱된 카테고리를 조회/생성한다고 가정합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ForumCategoryService {

    private final ElasticService elasticService;

    /**
     * [사전 정의된 카테고리 초기화 메서드]
     * KR: 애플리케이션 시작 시, 미리 정의된 카테고리를 ElasticSearch에 인덱싱합니다.
     */
    @PostConstruct
    private void initializeCategories() {
        log.info("ElasticSearch에 사전 정의된 포럼 카테고리 초기화 시작...");

        List<ForumCategoryDto> predefinedCategories = List.of(
                new ForumCategoryDto(null, "자유게시판", "자유롭게 이야기하는 공간입니다.", 0, 0, null, null, null, null),
                new ForumCategoryDto(null, "만남 게시판", "만남을 어레인지 하는 공간입니다.", 0, 0, null, null, null, null),
                new ForumCategoryDto(null, "레시피 리뷰/토론 게시판", "올라온 레시피들을 리뷰 및 토론하는 공간입니다.", 0, 0, null, null, null, null)
        );

        for (ForumCategoryDto categoryDto : predefinedCategories) {
            ForumCategoryDto existing = elasticService.getCategoryByTitle(categoryDto.getTitle());
            if (existing == null) {
                log.info("Creating category: {}", categoryDto.getTitle());
                elasticService.createCategory(categoryDto);
            } else {
                log.info("Category already exists: {}", categoryDto.getTitle());
            }
        }
    }


    /**
     * [전체 카테고리 조회 메서드]
     * KR: ElasticSearch에 인덱싱된 모든 카테고리를 조회합니다.
     *
     * @return ForumCategoryDto 리스트
     */
    public List<ForumCategoryDto> getAllCategories() {
        log.info("ElasticSearch에서 모든 포럼 카테고리를 조회합니다.");
        return elasticService.getAllCategoriesFromElastic();
    }

    /**
     * [특정 카테고리 조회 메서드 - Optional 사용]
     * KR: ElasticSearch에서 특정 카테고리를 ID로 조회하고, 존재하지 않으면 Optional.empty() 반환
     *
     * @param categoryId 조회할 카테고리 ID
     * @return Optional<ForumCategoryDto>
     */
    public Optional<ForumCategoryDto> getCategoryWithLatestPost(Integer categoryId) {
        log.info("ElasticSearch에서 카테고리 ID {} 를 조회합니다.", categoryId);
        ForumCategoryDto categoryDto = elasticService.getCategoryById(categoryId);

        // categoryDto가 null일 수 있으므로 Optional로 감싸서 반환
        return Optional.ofNullable(categoryDto);
    }
}
