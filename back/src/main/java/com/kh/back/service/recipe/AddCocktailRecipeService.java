package com.kh.back.service.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kh.back.dto.recipe.request.AddCocktailRecipeDto;
import com.kh.back.service.FirebaseService;
import com.kh.back.service.python.ElasticService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AddCocktailRecipeService {
    @Autowired
    private ElasticService elasticService;
    @Autowired
    private FirebaseService firebaseService;
    @Autowired
    private ObjectMapper objectMapper;

    public String saveCocktailRecipe(Long memberId, AddCocktailRecipeDto recipeRequest) {
        try {
            String image = firebaseService.uploadImage(recipeRequest.getImage(),recipeRequest.getName());

            // JSON 데이터 생성\
            Map<String, Object> recipeData = new HashMap<>();
            recipeData.put("type", recipeRequest.getType());
            recipeData.put("name", recipeRequest.getName());
            recipeData.put("glass", recipeRequest.getGlass());
            recipeData.put("category", recipeRequest.getCategory());
            recipeData.put("ingredients", recipeRequest.getIngredients());
            recipeData.put("garnish", recipeRequest.getGarnish());
            recipeData.put("preparation", recipeRequest.getPreparation());
            recipeData.put("abv", recipeRequest.getAbv());
            recipeData.put("like", 0L); // 기본값 설정
            recipeData.put("report", 0L); // 기본값 설정
            recipeData.put("author", memberId);
            recipeData.put("image", image);

            // JSON 문자열로 변환 후 업로드
            String data = objectMapper.writeValueAsString(recipeData);
            return elasticService.uploadRecipe(data);
        } catch (IOException e) {
            return "레시피 저장 중 오류 발생: " + e.getMessage();
        }
    }
}
