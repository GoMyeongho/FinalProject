package com.kh.back.controller.forum;

import com.kh.back.dto.forum.request.ForumPostLikeRequestDto;
import com.kh.back.dto.forum.response.ForumPostLikeResponseDto;
import com.kh.back.service.forum.ForumPostLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/forums")
public class ForumPostLikeController {

    private final ForumPostLikeService likeService;

    public ForumPostLikeController(ForumPostLikeService likeService) {
        this.likeService = likeService;
    }

    /**
     * 게시글 좋아요 토글
     *
     * @param postId 게시글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @return 좋아요 토글 결과 DTO
     * @apiNote 게시글에 대해 사용자가 좋아요/좋아요 취소를 수행합니다.
     */
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<ForumPostLikeResponseDto> toggleLikePost(
            @PathVariable Integer postId,
            @RequestParam Long loggedInMemberId) {
        ForumPostLikeResponseDto response = likeService.togglePostLike(postId, loggedInMemberId);
        return ResponseEntity.ok(response);
    }

    /**
     * 댓글 좋아요 토글
     *
     * @param commentId 댓글 ID
     * @param loggedInMemberId 요청 사용자 ID
     * @return 좋아요 토글 결과 DTO
     * @apiNote 댓글에 대해 사용자가 좋아요/좋아요 취소를 수행합니다.
     */
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<ForumPostLikeResponseDto> toggleLikeComment(
            @PathVariable Integer commentId,
            @RequestParam Long loggedInMemberId) {
        ForumPostLikeResponseDto response = likeService.toggleCommentLike(commentId, loggedInMemberId);
        return ResponseEntity.ok(response);
    }
}

