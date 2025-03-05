import styled from "styled-components";
import { Link } from "react-router-dom";

// Link 컴포넌트를 위한 스타일링
export const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  &:hover {
    text-decoration: none;
  }
`;

export const PostsContainer = styled.div`
  background-color: #f5f6f7;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 90px;
  font-family: "Arial", sans-serif;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

export const SectionHeader = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export const PostsSection = styled.div`
  margin-bottom: 30px;

  h3 {
    font-size: 18px;
    font-weight: bold;
    color: #555;
    margin-bottom: 10px;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }
`;

export const PostCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
  }
`;

export const PostTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 10px;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const PostDetails = styled.p`
  font-size: 14px;
  color: #555;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const PostMeta = styled.p`
  font-size: 12px;
  color: #777;
  margin: 5px 0;

  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

export const PostRightSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media (max-width: 768px) {
    align-items: flex-start;
    margin-top: 10px;
  }
`;

export const PostStat = styled.p`
  font-size: 14px;
  color: #555;
  margin: 5px 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

/* ✅ 최신 댓글 스타일 추가 */
export const LatestCommentContainer = styled.div`
  font-size: 12px;
  color: #666;
  text-align: right;
  margin-top: 5px;

  .comment-author {
    font-weight: bold;
    color: #333;
  }

  .comment-date {
    font-style: italic;
    color: #888;
  }

  .comment-preview {
    color: #444;
  }

  .no-comment {
    color: #aaa;
  }

  @media (max-width: 768px) {
    font-size: 10px;
    text-align: left;
  }
`;
