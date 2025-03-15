package com.kh.back.dto.forum.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor // 이걸 사용하면, 모든 필드를 파라미터로 받는 생성자를 Lombok이 자동 생성
public class ForumPostLikeResponseDto {

    private boolean liked;
    private Integer likesCount;
}
