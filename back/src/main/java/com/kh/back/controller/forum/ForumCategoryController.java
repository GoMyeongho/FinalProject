package com.kh.back.controller.forum;

import com.kh.back.dto.forum.response.ForumCategoryDto;
import com.kh.back.service.forum.ForumCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forums/categories")
@RequiredArgsConstructor
public class ForumCategoryController {
    private final ForumCategoryService categoryService;

    // 모든 카테고리 가져오기
    @GetMapping
    public ResponseEntity<List<ForumCategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    // 특정 카테고리와 최신 게시글 정보 가져오기
    @GetMapping("/{id}")
    public ResponseEntity<ForumCategoryDto> getCategoryWithLatestPost(@PathVariable Integer id) {
        return categoryService.getCategoryWithLatestPost(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
