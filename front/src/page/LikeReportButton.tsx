import React, { useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ReportIcon from '@mui/icons-material/Report';
import { useDispatch, useSelector } from 'react-redux';
import { toggleLikeRecipe, toggleReportRecipe } from '../context/redux/UserReducer';
import { RootState } from '../context/Store';
import axiosInstance from '../api/AxiosInstance';
import { AxiosError } from 'axios'; // AxiosError 임포트 추가

interface LikeReportButtonsProps {
    postId: string;
    type: string;
    likes: number;
    reports: number;
    updateCounts: (newLikes: number, newReports: number) => void;
}

const LikeReportButtons: React.FC<LikeReportButtonsProps> = ({ postId, type, likes, reports, updateCounts }) => {
    const dispatch = useDispatch();
    const { likedRecipes, reportedRecipes } = useSelector((state: RootState) => state.user);

    const isLiked = likedRecipes.has(postId);
    const isReported = reportedRecipes.has(postId);

    // 좋아요 토글
    const toggleLike = async () => {
        const increase = !isLiked;
        const url = `http://localhost:8111/recipe/updateCount?action=likes&postId=${postId}&type=${type}&increase=${increase}`;

        try {
            const response = await axiosInstance.post(url);
            if (response.data) {
                updateCounts(likes + (increase ? 1 : -1), reports); // 먼저 UI 상태를 업데이트
                dispatch(toggleLikeRecipe(postId)); // 그 후 리덕스 상태 업데이트
            }
        } catch (error) {
            console.error("좋아요 요청 실패:", error);

            // AxiosError로 타입 가드
            if (error instanceof AxiosError && error.response?.status === 401) {
                alert('좋아요 기능은 로그인 후 사용 가능합니다.');
            }
        }
    };

    // 신고 토글
    const toggleReport = async () => {
        const increase = !isReported;
        const url = `http://localhost:8111/recipe/updateCount?action=reports&postId=${postId}&type=${type}&increase=${increase}`;

        try {
            const response = await axiosInstance.post(url);
            if (response.data) {
                updateCounts(likes, reports + (increase ? 1 : -1)); // 먼저 UI 상태를 업데이트
                dispatch(toggleReportRecipe(postId)); // 그 후 리덕스 상태 업데이트
            }
        } catch (error) {
            console.error("신고 요청 실패:", error);

            // AxiosError로 타입 가드
            if (error instanceof AxiosError && error.response?.status === 401) {
                alert('신고 기능은 로그인 후 사용 가능합니다.');
            }
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ marginRight: 2 }}>
                    <strong>좋아요:</strong> {likes}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginRight: 2 }}>
                    <strong>신고:</strong> {reports}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton onClick={toggleLike} sx={{ color: isLiked ? 'red' : 'inherit' }}>
                    <FavoriteIcon />
                </IconButton>
                <IconButton onClick={toggleReport} sx={{ color: isReported ? 'orange' : 'inherit' }}>
                    <ReportIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default LikeReportButtons;