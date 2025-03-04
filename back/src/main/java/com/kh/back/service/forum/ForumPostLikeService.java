package com.kh.back.service.forum;

import com.kh.back.dto.forum.response.ForumPostLikeResponseDto;
import com.kh.back.entity.forum.ForumPost;
import com.kh.back.entity.forum.ForumPostComment;
import com.kh.back.entity.forum.ForumPostLike;
import com.kh.back.repository.forum.ForumPostCommentRepository;
import com.kh.back.repository.forum.ForumPostRepository;
import com.kh.back.entity.Member;
import com.kh.back.repository.MemberRepository;
import com.kh.back.repository.forum.ForumPostLikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ForumPostLikeService {

    private final ForumPostLikeRepository likeRepository;
    private final ForumPostRepository postRepository;
    private final ForumPostCommentRepository commentRepository;
    private final MemberRepository memberRepository;

    public ForumPostLikeService(ForumPostLikeRepository likeRepository, ForumPostRepository postRepository, ForumPostCommentRepository commentRepository, MemberRepository memberRepository) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.memberRepository = memberRepository;
    }

    /**
     * 게시글에 대한 좋아요 토글
     *
     * @param postId 게시글 ID
     * @param memberId 요청 사용자 ID
     * @return 좋아요 결과 DTO
     */
    @Transactional
    public ForumPostLikeResponseDto togglePostLike(Integer postId, Long memberId) {
        // 회원 정보 조회 (유효성 확인)
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자 ID입니다: " + memberId));

        Optional<ForumPostLike> existingLike = likeRepository.findByPostIdAndMemberId(postId, memberId);

        if (existingLike.isPresent()) {
            // 좋아요 취소 처리
            likeRepository.delete(existingLike.get());
            int totalLikes = likeRepository.countLikesForPost(postId);

            // likesCount를 업데이트
            ForumPost post = postRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글 ID입니다: " + postId));
            post.setLikesCount(totalLikes);
            postRepository.save(post);

            return new ForumPostLikeResponseDto(false, totalLikes); // 좋아요 취소
        } else {
            // 새로운 좋아요 추가
            ForumPostLike newLike = new ForumPostLike(postId, member);
            likeRepository.save(newLike);
            int totalLikes = likeRepository.countLikesForPost(postId);

            // likesCount를 업데이트
            ForumPost post = postRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글 ID입니다: " + postId));
            post.setLikesCount(totalLikes);
            postRepository.save(post);

            return new ForumPostLikeResponseDto(true, totalLikes); // 좋아요 추가
        }
    }


    @Transactional
    public ForumPostLikeResponseDto toggleCommentLike(Integer commentId, Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자 ID입니다: " + memberId));

        Optional<ForumPostLike> existingLike = likeRepository.findByCommentIdAndMemberId(commentId, memberId);

        if (existingLike.isPresent()) {
            // 좋아요 취소 처리
            likeRepository.delete(existingLike.get());
            int totalLikes = likeRepository.countLikesForComment(commentId);

            // likesCount를 업데이트
            ForumPostComment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글 ID입니다: " + commentId));
            comment.setLikesCount(totalLikes);
            commentRepository.save(comment);

            return new ForumPostLikeResponseDto(false, totalLikes); // 좋아요 취소
        } else {
            // 새로운 좋아요 추가
            ForumPostLike newLike = new ForumPostLike(commentId, member, true);
            likeRepository.save(newLike);
            int totalLikes = likeRepository.countLikesForComment(commentId);

            // likesCount를 업데이트
            ForumPostComment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글 ID입니다: " + commentId));
            comment.setLikesCount(totalLikes);
            commentRepository.save(comment);

            return new ForumPostLikeResponseDto(true, totalLikes); // 좋아요 추가
        }
    }
}
