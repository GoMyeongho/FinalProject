package com.kh.back.dto.forum.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 좋아요 관련 정보를 전송하기 위한 DTO
 */
@Data
public class ForumPostLikeResponseDto {

    /**
     * 좋아요 상태 (추가 또는 취소 여부)
     */
    private boolean liked;

    /**
     * 총 좋아요 개수
     */
    private Integer totalLikes;

    /**
     * 생성자: 좋아요 상태와 총 좋아요 개수를 설정합니다.
     *
     * @param liked 좋아요 상태 (true: 좋아요, false: 취소)
     * @param totalLikes 총 좋아요 개수
     */
    public ForumPostLikeResponseDto(boolean liked, Integer totalLikes) {
        this.liked = liked;
        this.totalLikes = totalLikes;
    }
}
