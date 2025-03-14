package com.kh.back.service.recipe;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kh.back.dto.recipe.request.AddFoodRecipeDto;
import com.kh.back.service.FirebaseService;
import com.kh.back.service.member.MemberService;
import com.kh.back.service.python.ElasticService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AddFoodRecipeService {
    @Autowired
    private ElasticService elasticService;
    @Autowired
    private FirebaseService firebaseService;
    @Autowired
    private ObjectMapper objectMapper;


    // 레시피 저장
    public String saveRecipe(Long memberId, AddFoodRecipeDto recipeRequest) {
        try {
            // 이미지 업로드 및 URL 획득
            String mainImageUrl = firebaseService.uploadImage(recipeRequest.getAttFileNoMain(),recipeRequest.getName());
            List<Map<String, String>> manualsWithUrls = recipeRequest.getManuals().stream()
                    .map(manual -> {
                        try {
                            String imageUrl = firebaseService.uploadImage(manual.getImageUrl(),recipeRequest.getName());
                            Map<String, String> manualMap = new HashMap<>();
                            manualMap.put("text", manual.getText());
                            manualMap.put("imageUrl", imageUrl);
                            return manualMap;
                        } catch (IOException e) {
                            throw new RuntimeException("이미지 업로드 실패: " + e.getMessage());
                        }
                    })
                    .collect(Collectors.toList());

            // JSON 데이터 생성
            Map<String, Object> recipeData = new HashMap<>();
            recipeData.put("type", recipeRequest.getType());
            recipeData.put("name", recipeRequest.getName());
            recipeData.put("RCP_WAY2", recipeRequest.getRcpWay2());
            recipeData.put("RCP_PAT2", recipeRequest.getRcpPat2());
            recipeData.put("INFO_WGT", recipeRequest.getInfoWgt());
            recipeData.put("ATT_FILE_NO_MAIN", mainImageUrl);
            recipeData.put("RCP_NA_TIP", recipeRequest.getRcpNaTip());
            recipeData.put("ingredients", recipeRequest.getIngredients());
            recipeData.put("MANUALS", manualsWithUrls);
            recipeData.put("author", memberId);
            // JSON 문자열로 변환 후 업로드
            String data = objectMapper.writeValueAsString(recipeData);
            return elasticService.uploadRecipe(data);
        } catch (IOException e) {
            return "레시피 저장 중 오류 발생: " + e.getMessage();
        }
    }
}
