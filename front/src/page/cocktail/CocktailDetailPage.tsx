import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Grid, Box, CircularProgress, Alert, Divider } from '@mui/material';
import Comment from '../comment/Comment';
import LikeReportButtons from '../LikeReportButton';
import Profile from '../profile/Profile';

// 칵테일 재료 DTO 타입 정의
interface CocktailIngDto {
    unit: string;
    amount: number;
    ingredient: string;
    special?: string;
}

// 칵테일 상세 정보 DTO 타입 정의
interface CocktailResDto {
    id: string;
    name: string;
    preparation: string;
    image: string;
    category: string;
    abv: number;
    garnish: string;
    glass: string;
    like: number;
    report: number;
    author: number;
    ingredients: CocktailIngDto[];
}

const CocktailDetail: React.FC = () => {
    const [cocktail, setCocktail] = useState<CocktailResDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [likes, setLikes] = useState<number>(0);
    const [reports, setReports] = useState<number>(0);

    const { id, type } = useParams<{ id: string; type: string }>();

    // 칵테일 정보 불러오기
    useEffect(() => {
        const fetchCocktail = async () => {
            try {
                const response = await axios.get<CocktailResDto>(`http://localhost:8111/test/detail/${id}?type=${type}`);
                console.log('Response Data:', response.data);
                setCocktail(response.data);
                setLikes(response.data.like);
                setReports(response.data.report);
                setLoading(false);
            } catch (err) {
                setError('칵테일 상세 정보를 불러오는 데 실패했습니다.');
                setLoading(false);
            }
        };

        fetchCocktail();
    }, [id, type]);

    // 좋아요/신고 수 업데이트 함수
    const updateCounts = (newLikes: number, newReports: number) => {
        setLikes(newLikes);
        setReports(newReports);
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!cocktail) return <Alert severity="warning">칵테일을 찾을 수 없습니다.</Alert>;

    return (
        <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 3 }}>
            <Card>
                <CardMedia
                    component="img"
                    image={cocktail.image}
                    alt={cocktail.name}
                    sx={{ borderRadius: 2, height: 800, width: '100%', objectFit: 'cover' }}
                />
                <CardContent>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', marginBottom: 3 }}>
                        {cocktail.name}
                    </Typography>
                    <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>알콜 도수 (ABV):</strong> {cocktail.abv}%
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>글래스:</strong> {cocktail.glass}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>분류:</strong> {cocktail.category}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>조리 과정:</strong> {cocktail.preparation}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
    <Profile userId={cocktail.author} customStyle={null} />
</Box>
                    {/* 재료 */}
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', marginTop: 3 }}>
                        재료
                    </Typography>
                    <Divider sx={{ marginBottom: 2 }} />
                    <Grid container spacing={2}>
                        {cocktail.ingredients?.map((ingredient, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Typography variant="body1">
                                    {ingredient.ingredient === null && ingredient.special ? (
                                        `${ingredient.special}`
                                    ) : (
                                        `${ingredient.ingredient}: ${ingredient.amount} ${ingredient.unit}`
                                    )}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>

                    {cocktail.garnish && (
                        <Grid item xs={12} md={6}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>가니시:</strong> {cocktail.garnish}
                            </Typography>
                        </Grid>
                    )}

        
                    {/* 좋아요/신고 버튼 */}
       
                    <LikeReportButtons
                        postId={cocktail.id}
                        type={type || ""}
                        likes={likes}
                        reports={reports}
                        updateCounts={updateCounts}
                    />


                    {/* 댓글 섹션 */}
                    <Comment postId={id ?? ''} />
                </CardContent>
            </Card>
        </Box>
    );
};

export default CocktailDetail;
