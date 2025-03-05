package com.kh.back.dto.forum.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ForumCategoryDto
 * 포럼 카테고리 정보를 클라이언트로 전달하기 위한 DTO 클래스
 */
@Data
@AllArgsConstructor
public class ForumCategoryDto {
    private Integer id; // 카테고리 ID
    private String title; // 카테고리 제목
    private String description; // 카테고리 설명
    private int postCount; // 카테고리의 게시글 수
    private int commentCount; // 카테고리 내 댓글 수
    private LocalDateTime updatedAt; // 카테고리 최종 수정 시간

    // 추가 필드: 최신 게시글 정보
    private String latestPostTitle; // 최신 게시글 제목
    private String latestPostAuthor; // 최신 게시글 작성자 이름
    private LocalDateTime latestPostCreatedAt; // 최신 게시글 작성 시간
}
