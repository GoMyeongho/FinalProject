import React, { useState, useEffect } from "react";
import ForumApi from "../../api/ForumApi";
import { Link, useNavigate } from "react-router-dom"; // KR: 리디렉션을 위한 useNavigate 임포트
import { toast, ToastContainer } from "react-toastify"; // KR: 토스트 메시지와 컨테이너 임포트
import "react-toastify/dist/ReactToastify.css";
import ReduxApi from "../../api/ReduxApi"; // KR: 사용자 정보를 가져오기 위한 ReduxApi 임포트
import {
  ForumContainer,
  Section,
  // SectionTitle,  // (사용하지 않음)
  ForumCategoryCard,
  CategoryTitle,
  CategoryDescription,
  CategoryMeta,
  SectionHeaderRow,
  ForumHeaderTitle,
  CreateButtonLink,
} from "./style/ForumStyles";

// KR: 포럼 메인 페이지 컴포넌트
const Forum = () => {
  const navigate = useNavigate();

  // KR: 페이지 로드시 body의 배경색을 설정
  useEffect(() => {
    document.body.style.backgroundColor = "#f5f6f7";
  }, []);

  // KR: 현재 사용자 정보 상태 초기화
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  // KR: 현재 사용자 정보를 가져오는 함수 (Feed.js의 fetchMemberData와 동일한 방식)
  const fetchMemberData = async () => {
    try {
      const response = await ReduxApi.getMyInfo();
      const userInfo = response.data; // KR: ReduxController가 반환한 사용자 정보
      // KR: ReduxResDto는 { id, email, nickname, role }를 포함합니다.
      if (userInfo && userInfo.id) {
        setUserId(userInfo.id);
        setUserData({
          name: userInfo.nickname,
          email: userInfo.email,
          role: userInfo.role,
        });
      } else {
        // KR: 로그인하지 않은 경우 토스트 경고 메시지를 출력한 후 2.5초 후에 로그인 페이지로 리디렉션
        toast.warning("로그인이 필요합니다.");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      }
    } catch (error) {
      console.error("사용자 정보를 가져오는 중 오류:", error);
      toast.error("사용자 정보를 확인할 수 없습니다.");
    }
  };

  // KR: 컴포넌트 마운트 시 현재 사용자 정보 호출
  useEffect(() => {
    fetchMemberData();
  }, []);

  // KR: 포럼 카테고리 데이터 상태 및 로딩 상태
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // KR: 포럼 카테고리 데이터를 서버에서 불러오는 useEffect
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData = await ForumApi.fetchCategories();
        console.log("Fetched Categories:", categoryData);
        setCategories(categoryData);
      } catch (error) {
        console.error("데이터를 가져오는데 실패했습니다:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading categories...</div>;

  return (
    <ForumContainer>
      <Section>
        {/* KR: 상단 헤더 Row - 가운데 제목과 오른쪽의 '새 글 작성' 버튼 */}
        <SectionHeaderRow>
          <ForumHeaderTitle>포럼 카테고리</ForumHeaderTitle>
          <CreateButtonLink to="/forum/create-post">
            새 글 작성
          </CreateButtonLink>
        </SectionHeaderRow>

        {/* KR: 카테고리 목록 렌더링 */}
        <div className="category-grid">
          {categories.map((category) => (
            <ForumCategoryCard key={category.id}>
              <Link
                to={`/forum/category/${category.id}`}
                state={{ categoryName: category.title }}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <CategoryTitle>{category.title}</CategoryTitle>
                <CategoryDescription>
                  {category.description}
                </CategoryDescription>
                <CategoryMeta>
                  {category.postCount > 0
                    ? `${category.postCount} 개의 게시글이 존재`
                    : "게시글이 아직 없습니다"}
                </CategoryMeta>
              </Link>
            </ForumCategoryCard>
          ))}
        </div>
      </Section>
      {/* KR: ToastContainer 추가 (Feed.js와 동일하게 토스트 메시지가 표시됨) */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </ForumContainer>
  );
};

export default Forum;
