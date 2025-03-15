package com.kh.back.dto.forum.request;

import lombok.Data;

/**
 * 좋아요 요청을 위한 DTO
 */
@Data
public class ForumPostLikeRequestDto {

    /**
     * 좋아요 요청을 보낸 사용자 ID
     */
    private Long memberId;

    /**
     * 좋아요 대상 게시글 ID
     */
    private String postId; // 기존 Integer -> String 으로 변경

    /**
     * 좋아요 대상 댓글 ID
     */
    private Integer commentId;
}
