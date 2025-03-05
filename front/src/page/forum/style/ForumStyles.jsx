import styled from "styled-components";
import { Link } from "react-router-dom";

/**
 * Forum 레이아웃 컨테이너
 */
export const ForumContainer = styled.div`
  background-color: #f5f6f7;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 90px; /* Header margin adjustment */
  font-family: "Arial", sans-serif;

  @media (max-width: 768px) {
    padding: 10px;
    margin-top: 70px; /* 모바일 환경에서 헤더 높이 조정 */
  }
`;

/**
 * (옵션) 헤더 (디버깅용) - 사용 중이면 그대로 두세요.
 */
export const ForumHeader = styled.div`
  background-color: #ffffff;
  padding: 15px 20px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #333;
  }

  p {
    font-size: 14px;
    color: #555;
  }
`;

/**
 * Section: 각 블록(카테고리 목록 등)을 감싸는 섹션
 */
export const Section = styled.div`
  margin-top: 20px;
  background-color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

/**
 * (기존) 섹션 제목 - 이제는 가운데 정렬이 아닌, 아래 새 컴포넌트를 권장
 */
export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

/**
 * ForumCategoryCard: 각 카테고리 하나의 박스
 */
export const ForumCategoryCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

export const CategoryTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const CategoryDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const CategoryMeta = styled.small`
  font-size: 12px;
  color: #777;
  display: block;
  text-align: right;
  margin-top: 10px;

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

/**
 * SectionHeaderRow:
 *  - Flex 컨테이너. 가운데에 제목(가변 폭), 오른쪽에 버튼
 */
export const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  /* justify-content: space-between;  -- 안 쓰고 아래처럼 수동 배치할 것 */
`;

/**
 * ForumHeaderTitle:
 *  - 가운데 정렬, flex: 1
 *  - 기존 SectionTitle 대신 사용
 */
export const ForumHeaderTitle = styled.h2`
  flex: 1; /* 남은 공간을 모두 차지 */
  text-align: center; /* 텍스트 가운데 정렬 */
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin: 0; /* 기본 h2 margin 제거 */

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

/**
 * 새 글 작성 버튼 (링크)
 */
export const CreateButtonLink = styled(Link)`
  padding: 8px 12px;
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;

  &:hover {
    background-color: #0056b3;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 6px 10px;
  }
`;
