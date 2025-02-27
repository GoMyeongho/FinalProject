import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Header from "./component/header/Header";
import MainContainer from "./component/MainContainer";
import ProfilePage from "./page/profile/ProfilePage";
import { CheckoutPage } from "./component/payments/Checkout";
import { SuccessPage } from "./component/payments/Succeess";
import { FailPage } from "./component/payments/Fail";
import CocktailListPage from "./page/cocktail/CocktailListPage";
import CocktailDetailPage from "./page/cocktail/CocktailDetailPage";
import FoodListPage from "./page/food/FoodListPage";

function App() {
  return (
    // 라이트 모드: bg-white, 다크 모드: bg-[#2B1D0E], 전체 화면 높이
    <div className="bg-white dark:bg-[#2B1D0E] min-h-screen transition-colors">
      <Router>
        <Header />
        <MainContainer>
          <Routes>
            <Route path="/" element={<ProfilePage />} />
            {/* 결제 페이지 */}
            <Route path="/sandbox" element={<CheckoutPage />} />{" "}
            {/* /sandbox 경로에 CheckoutPage 연결 */}
            <Route path="/sandbox/success" element={<SuccessPage />} />{" "}
            {/* /sandbox/success 경로에 SuccessPage 연결 */}
            <Route path="/sandbox/fail" element={<FailPage />} />{" "}
            {/* /sandbox/fail 경로에 FailPage 연결 */}
            {/* 레시피 페이지 (라우트 경로 수정됨) */}
            <Route path="/cocktail-recipe" element={<CocktailListPage />} />
            <Route
              path="/cocktail-recipe/:id"
              element={<CocktailDetailPage />}
            />
            <Route path="/food-recipe" element={<FoodListPage />} />
          </Routes>
        </MainContainer>
      </Router>
    </div>
  );
}

export default App;
