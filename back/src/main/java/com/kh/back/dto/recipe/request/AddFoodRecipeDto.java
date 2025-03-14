package com.kh.back.dto.recipe.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
public class AddFoodRecipeDto {
    private String type;
    private String name;
    private String rcpWay2;
    private String rcpPat2;
    private String infoWgt;
    private MultipartFile attFileNoMain;

    private String rcpNaTip;
    private List<Ingredients> Ingredients;
    private List<Manual> manuals;
    private Long authory;

    @Data
    public static class Ingredients {
        private String ingredient;
        private String amount;
    }

    @Data
    public static class Manual {
        private String text;
        private MultipartFile imageUrl; // 조리법 이미지 파일
    }
}