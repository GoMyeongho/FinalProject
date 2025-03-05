package com.kh.back.dto.forum.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 페이지네이션 데이터를 포함한 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginationDto<T> {
    private List<T> data; // 페이지 데이터
    private Integer currentPage; // 현재 페이지 번호
    private Integer totalPages; // 총 페이지 수
    private Long totalElements; // 총 데이터 수
}
