import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Grid, Box, CircularProgress, Alert, Divider } from '@mui/material';
import Comment from '../comment/Comment';


import Profile from '../profile/Profile';
import LikeReportButtons from '../LikeReportButton'; 

// 재료 DTO 타입 정의
interface IngredientDto {
    ingredient: string;
    amount: string;
}

// 조리 과정 DTO 타입 정의
interface ManualDto {
    text: string;
    imageUrl: string;
}

// 레시피 상세 정보 DTO 타입 정의
interface FoodResDto {
    name: string;
    cookingMethod: string;
    category: string;
    description: string;
    ingredients: IngredientDto[];
    instructions: ManualDto[];
    image: string;
    like: number;
    report: number;
    author: number;
}

const RecipeDetail: React.FC = () => {
    const [recipe, setRecipe] = useState<FoodResDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const { id, type } = useParams<{ id: string; type: string }>();

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const response = await axios.get<FoodResDto>(`http://localhost:8111/test/detail/${id}?type=${type}`);
                setRecipe(response.data);
                setLoading(false);
            } catch (err) {
                setError('레시피 상세 정보를 불러오는 데 실패했습니다.');
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, type]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!recipe) return <Alert severity="warning">레시피를 찾을 수 없습니다.</Alert>;

    return (
        <Box sx={{ maxWidth: 1200, margin: 'auto', padding: 3 }}>
            <Card>
                <CardMedia
                    component="img"
                    image={recipe.image}
                    alt={recipe.name}
                    sx={{ borderRadius: 2, height: 800, width: '100%', objectFit: 'cover' }}
                />
                <CardContent>
                    <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', marginBottom: 3 }}>
                        {recipe.name}
                    </Typography>
                    <Grid container spacing={2} sx={{ marginBottom: 3 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>조리 방법:</strong> {recipe.cookingMethod}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>요리 종류:</strong> {recipe.category}
                            </Typography>
                        </Grid>
                
                    </Grid>

                    {/* 작성자 프로필 */}
                    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
    <Profile userId={recipe.author} customStyle={null} />
</Box>

<Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary">
                                <strong>팁:</strong> {recipe.description}
                            </Typography>
                        </Grid>


                    {/* 재료 */}
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', marginTop: 3 }}>
                        재료
                    </Typography>
                    <Divider sx={{ marginBottom: 2 }} />
                    <Grid container spacing={2}>
                        {recipe.ingredients?.map((ingredient, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Typography variant="body1">
                                    {`${ingredient.ingredient}: ${ingredient.amount}`}
                                </Typography>
                            </Grid>
                        ))}
                    </Grid>

                    {/* 조리 과정 */}
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', marginTop: 4 }}>
    조리 과정
</Typography>
<Divider sx={{ marginBottom: 2 }} />

{recipe.instructions?.map((manual, index) => (
    <Grid
        container
        spacing={2}
        key={index}
        alignItems="flex-start" // 상단 정렬
        sx={{ marginBottom: 4 }}
    >
        {/* 조리 과정 이미지 */}
        {manual.imageUrl && (
            <Grid item xs={12} md={6}>
                <CardMedia
                    component="img"
                    image={manual.imageUrl}
                    alt={`조리 과정 ${index + 1}`}
                    sx={{
                        borderRadius: 2,
                        width: '100%',
                        maxWidth: 400, // 이미지 크기 키움
                        height: 300, // 이미지 높이 조정
                        objectFit: 'cover',
                    }}
                />
            </Grid>
        )}

        {/* 조리 과정 텍스트 (Step과 텍스트 세로 배치) */}
        <Grid item xs={12} md={6}>
            {/* Step 제목 */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {`Step ${index + 1}`}
            </Typography>

            {/* 구분선 */}
            <Divider sx={{ marginBottom: 2 }} />

            {/* 조리 과정 텍스트 */}
            <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>
                {manual.text}
            </Typography>
        </Grid>
    </Grid>
))}                 

 <LikeReportButtons
postId={id ?? ''}
type={type ?? ''}
likes={recipe.like}
reports={recipe.report}
updateCounts={(newLikes, newReports) =>
    setRecipe(prev => prev ? { ...prev, like: newLikes, report: newReports } : prev)
}
/>


                    {/* 댓글 섹션 */}
                    <Comment postId={id ?? ''} />
                </CardContent>
            </Card>
        </Box>
    );
};

export default RecipeDetail;
