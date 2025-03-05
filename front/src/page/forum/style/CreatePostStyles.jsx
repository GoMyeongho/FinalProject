import styled from "styled-components";

export const CreatePostContainer = styled.div`
  background-color: #f5f6f7;
  max-width: 800px;
  margin: 70px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    margin: 50px auto;
    padding: 15px;
  }
`;

export const CreatePostTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

export const CreatePostForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;

  label {
    font-size: 14px;
    font-weight: bold;
    color: #555;
  }

  input,
  textarea,
  select {
    padding: 10px;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #ffffff;
  }

  /* ✅ 스타일 추가: 에디터 입력 필드 */
  .editor {
    border: 1px solid #ccc; /* 테두리 추가 */
    border-radius: 5px;
    background-color: white; /* 배경색을 흰색으로 */
    padding: 10px; /* 내부 여백 */
    min-height: 200px; /* 최소 높이 설정 */
    font-size: 14px;
    outline: none;
  }

  /* 모바일 최적화 */
  @media (max-width: 768px) {
    label {
      font-size: 13px;
    }
    input,
    textarea,
    select {
      font-size: 13px;
      padding: 8px;
    }
    .editor {
      min-height: 150px; /* 모바일에서도 충분한 높이 */
    }
  }
`;

export const CreatePostButton = styled.button`
  background-color: ${(props) => (props.disabled ? "#cccccc" : "#007bff")};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.3s;

  &:hover:enabled {
    background-color: #0056b3;
  }
`;

export const EditorToolbar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 10px;

  button {
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 5px;
    border: 2px solid #007bff;
    background-color: white;
    color: #007bff;
    cursor: pointer;

    &:hover {
      background: #f0f0f0;
    }
  }
`;
