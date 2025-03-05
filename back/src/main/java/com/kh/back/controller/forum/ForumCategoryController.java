package com.kh.back.controller.forum;

import com.kh.back.dto.forum.response.ForumCategoryDto;
import com.kh.back.service.forum.ForumCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ForumCategoryController
 * <p>
 * KR: 포럼 카테고리 관련 REST API 엔드포인트를 정의합니다.
 */
@RestController
@RequestMapping("/api/forums/categories")
@RequiredArgsConstructor
@Slf4j
public class ForumCategoryController {

    private final ForumCategoryService categoryService;

    /**
     * [전체 카테고리 조회 엔드포인트]
     * KR: 모든 카테고리를 ElasticSearch에서 가져와 반환합니다.
     *
     * @return 카테고리 목록 (List<ForumCategoryDto>)
     */
    @GetMapping
    public ResponseEntity<List<ForumCategoryDto>> getAllCategories() {
        log.info("모든 카테고리 조회 요청");
        List<ForumCategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * [특정 카테고리 조회 엔드포인트]
     * KR: 카테고리 ID를 받아, 해당 카테고리를 조회하고
     *     존재하면 200 OK, 없으면 404 Not Found를 반환합니다.
     *
     * @param id 카테고리 ID
     * @return ForumCategoryDto (존재 시) 또는 404 Not Found
     */
    @GetMapping("/{id}")
    public ResponseEntity<ForumCategoryDto> getCategoryWithLatestPost(@PathVariable Integer id) {
        log.info("카테고리 ID {} 조회 요청", id);
        return categoryService.getCategoryWithLatestPost(id)
                .map(ResponseEntity::ok)             // Optional에 값이 있으면 200 OK
                .orElse(ResponseEntity.notFound().build());  // 값이 없으면 404
    }
}
