package com.kh.back.service.forum;

import com.kh.back.dto.forum.response.ForumPostLikeResponseDto;
import com.kh.back.service.python.ElasticService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ForumPostLikeService {

    private final ElasticService elasticService;

    /**
     * 게시글에 대한 좋아요 토글
     *
     * @param postId   게시글 ID
     * @param memberId 요청 사용자 ID
     * @return 좋아요 결과 DTO
     */
    @Transactional
    public ForumPostLikeResponseDto togglePostLike(Integer postId, Long memberId) {
        return elasticService.togglePostLike(postId, memberId);
    }

    /**
     * 댓글에 대한 좋아요 토글
     *
     * @param commentId 댓글 ID
     * @param memberId  요청 사용자 ID
     * @return 좋아요 결과 DTO
     */
    @Transactional
    public ForumPostLikeResponseDto toggleCommentLike(Integer commentId, Long memberId) {
        return elasticService.toggleCommentLike(commentId, memberId);
    }
}
