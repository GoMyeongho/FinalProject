import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AxiosError } from 'axios';
import { Box, List, Divider, TextField, Button, Typography, Pagination } from '@mui/material';
import axiosInstance from '../../api/AxiosInstance';

// 댓글 DTO 타입 정의
interface CommentDto {
    commentId: number;
    nickName: string;
    content: string;
    parentCommentId: number | null;
    replies: CommentDto[];
}

interface CommentSectionProps {
    postId: string; // 댓글이 속한 게시물 ID
}

const Comment: React.FC<CommentSectionProps> = ({ postId }) => {
    const [comments, setComments] = useState<CommentDto[]>([]);
    const [commentContent, setCommentContent] = useState<string>('');
    const [replyContent, setReplyContent] = useState<string>('');
    const [expandedCommentIds, setExpandedCommentIds] = useState<number[]>([]);
    const [page, setPage] = useState<number>(1);  // 현재 페이지
    const [totalPages, setTotalPages] = useState<number>(1);  // 전체 페이지 수

    // 댓글을 가져오는 함수
    const fetchComments = async () => {
        try {
            const response = await axios.get<{ content: CommentDto[]; totalPages: number }>(`http://localhost:8111/comments/${postId}`, {
                params: {
                    page: page - 1, // 0 기반 인덱스를 사용하므로 -1
                    size: 5, // 한 페이지에 5개 댓글
                }
            });
            setComments(response.data.content ?? []);
            setTotalPages(response.data.totalPages);  // 전체 페이지 수 설정
        } catch (err) {
            console.error('댓글을 불러오는 데 실패했습니다.', err);
            setComments([]);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId, page]);

    const handleCommentSubmit = async () => {
        if (commentContent.trim() === '') return;
    
        try {
            const response = await axiosInstance.post(
                `http://localhost:8111/comments/addComment`,
                { content: commentContent, recipeId: postId } // 'recipeId'에 'postId' 사용
            );
            if (response.data) {
                // 댓글 작성 후 댓글 목록 새로 고침
                fetchComments();
                setCommentContent('');
            }
        } catch (err) {
            console.error('댓글 작성에 실패했습니다.', err);
    
            // AxiosError로 타입 가드
            if (err instanceof AxiosError && err.response && err.response.status === 500) {
                alert('댓글 작성은 로그인 후 사용 가능합니다.');
            }
        }
    };
    const handleReplySubmit = async (parentCommentId: number, replyContent: string) => {
        if (replyContent.trim() === '') return;

        try {
            const response = await axios.post(`http://localhost:8111/comments/reply/${parentCommentId}`, { content: replyContent });
            if (response.data) {
                setComments(comments.map(comment =>
                    comment.commentId === parentCommentId
                        ? { ...comment, replies: [...comment.replies, { commentId: Date.now(), nickName: '', content: replyContent, parentCommentId, replies: [] }] }
                        : comment
                ));
            }
        } catch (err) {
            console.error('대댓글 작성에 실패했습니다.', err);
        }
    };

    const toggleReplies = (commentId: number) => {
        setExpandedCommentIds(prev => prev.includes(commentId) ? prev.filter(id => id !== commentId) : [...prev, commentId]);
    };

    return (
        <Box sx={{ marginTop: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>댓글</Typography>
            <List>
                {comments.map(comment => (
                    <CommentItem
                        key={comment.commentId}
                        comment={comment}
                        onReplySubmit={handleReplySubmit}
                        toggleReplies={toggleReplies}
                        expanded={expandedCommentIds.includes(comment.commentId)}
                    />
                ))}
            </List>
            <Box sx={{ marginTop: 2 }}>
                <Divider sx={{ marginBottom: 2 }} />
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="댓글을 작성하세요"
                    sx={{ marginBottom: 2 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCommentSubmit}
                    disabled={commentContent.trim() === ''}
                >
                    댓글 작성
                </Button>
            </Box>

            {/* 페이지 네비게이션 */}
            <Box sx={{ marginTop: 3, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    color="primary"
                />
            </Box>
        </Box>
    );
};

const CommentItem: React.FC<{
    comment: CommentDto;
    onReplySubmit: (parentCommentId: number, replyContent: string) => void;
    toggleReplies: (commentId: number) => void;
    expanded: boolean;
}> = ({ comment, onReplySubmit, toggleReplies, expanded }) => {
    const [replyContent, setReplyContent] = useState<string>('');

    return (
        <Box sx={{ marginBottom: 2, paddingLeft: 2 }}>
            <Divider sx={{ marginBottom: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {comment.nickName}:
                </Typography>
                <Typography variant="body1" sx={{ marginLeft: 1 }}>
                    {comment.content}
                </Typography>
                <Button size="small" onClick={() => toggleReplies(comment.commentId)} sx={{ marginLeft: 2 }}>
                    {expanded ? '답글 숨기기' : '답글'}
                </Button>
            </Box>

            {expanded && comment.replies.length > 0 && (
                <Box sx={{ paddingLeft: 4 }}>
                    <Divider sx={{ marginBottom: 2 }} />
                    <List sx={{ paddingLeft: 4 }}>
                        {comment.replies.map(reply => (
                            <Box key={reply.commentId} sx={{ marginBottom: 1, paddingLeft: 4 }}>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    - {reply.nickName}: {reply.content}
                                </Typography>
                            </Box>
                        ))}
                    </List>
                </Box>
            )}

            {expanded && (
                <Box sx={{ marginTop: 2, paddingLeft: 4 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="대댓글을 작성하세요"
                        variant="outlined"
                        sx={{ marginBottom: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            onReplySubmit(comment.commentId, replyContent);
                            setReplyContent('');
                        }}
                        disabled={replyContent.trim() === ''}
                    >
                        대댓글 작성
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default Comment;
