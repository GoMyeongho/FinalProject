import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProfilePage from "./page/profile/ProfilePage";
import { CheckoutPage } from "./component/payments/Checkout";
import { SuccessPage } from "./component/payments/Succeess";
import { FailPage } from "./component/payments/Fail";
import CocktailListPage from "./page/cocktail/CocktailListPage";
import CocktailDetailPage from "./page/cocktail/CocktailDetailPage";
import FoodListPage from "./page/food/FoodListPage";
import ProfileCustomization from "./page/profile/cardcustom/ProfileCustomization";
import Layout from "./page/layout/Layout";
import GlobalStyle from "./page/layout/style/GlobalStyle";

import Forum from "./page/forum/Forum";
// import PostDetail from "./page/forum/PostDetail/PostDetail";
// import CreatePost from "./page/forum/CreatePost";
// import ForumPosts from "./page/forum/ForumPosts";

function App() {
  return (
    // 라이트 모드: bg-white, 다크 모드: bg-[#2B1D0E], 전체 화면 높이
    <div className="bg-white dark:bg-[#2B1D0E] min-h-screen transition-colors">
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/*프로필 페이지*/}
            <Route path="profile/:id?" element={<ProfilePage />} />
            {/*프로필 페이지에서 id가 있으면 다른 사람의 프로필을 볼 수 있게*/}
            <Route
              path="profile/cardcustom"
              element={<ProfileCustomization />}
            />
            {/* 레시피 페이지 (라우트 경로 수정됨) */}
            <Route path="recipe/:index" element={<CocktailListPage />} />
            {/*컴포넌트를 같은 컴포넌트를 쓰되 index를 다르게 해서 관리하기*/}
            <Route path="detail/:index/:id" element={<CocktailDetailPage />} />
            <Route path="recipe/food" element={<FoodListPage />} />
            {/* 포럼 게시판 페이지 */}
            <Route path="/forum" element={<Forum />} />
            {/* <Route path="/forum/post/:postId" element={<PostDetail />} /> */}
            {/* <Route path="/forum/create-post" element={<CreatePost />} /> */}
            {/* <Route
              path="/forum/category/:categoryId"
              element={<ForumPosts />}
            /> */}
          </Route>
          {/* 결제 페이지 */}
          <Route path="/pay" element={<CheckoutPage />} />
          {/* /sandbox 경로에 CheckoutPage 연결 */}
          <Route path="/pay/success" element={<SuccessPage />} />
          {/* /sandbox/success 경로에 SuccessPage 연결 */}
          <Route path="/pay/fail" element={<FailPage />} />
          {/* /sandbox/fail 경로에 FailPage 연결 */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
