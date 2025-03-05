package com.kh.back.dto.forum.request;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 새로운 게시글 생성을 위한 요청 DTO
 * KR: 게시글 생성 시 HTML 콘텐츠와 Tiptap JSON 콘텐츠를 모두 받을 수 있도록 필드를 추가함.
 */
@Data
@Builder            // 빌더 패턴 사용을 위해 추가
@NoArgsConstructor // 기본 생성자
@AllArgsConstructor // 모든 필드를 포함한 생성자
public class ForumPostRequestDto {
    private Integer categoryId; // 카테고리 ID
    private Long memberId; // 작성자 ID
    private String title; // 게시글 제목
    private String content; // 게시글 내용 (HTML)
    private Boolean sticky; // 상단 고정 여부 (기본값)
    private Boolean editedByAdmin; // 관리자 수정 여부
    private List<String> fileUrls; // 첨부 파일 URL 목록
    /**
     * 게시글 내용의 JSON 표현 (Tiptap JSON)
     * KR: Tiptap 에디터의 JSON 형태 콘텐츠를 저장하기 위한 필드
     */
    private String contentJSON;
}
