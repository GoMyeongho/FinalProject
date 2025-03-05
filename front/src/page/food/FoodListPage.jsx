import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchFoodList } from "../../api/FoodApi";
import placeholder2 from "./style/placeholder2.png";

/**
 * 음식 레시피 목록 페이지
 * - 검색어(query)와 필터(카테고리 또는 조리방법)를 적용
 * - Intersection Observer와 React ref를 사용해 무한 스크롤 구현
 * - 필터 클릭 시, 인자로 직접 넘겨 "두 번 클릭" 문제를 방지
 */
const FoodListPage = () => {
  // -------------------- 기존 상태 --------------------
  const [foods, setFoods] = useState([]); // 음식 레시피 목록
  const [query, setQuery] = useState(""); // 검색어
  const [selectedFilterType, setSelectedFilterType] = useState("카테고리");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCookingMethod, setSelectedCookingMethod] = useState("");

  // -------------------- 무한 스크롤 상태 --------------------
  const [page, setPage] = useState(1); // 현재 페이지 번호
  const [hasMore, setHasMore] = useState(true); // 추가 데이터 존재 여부
  const observerRef = useRef(null); // IntersectionObserver 저장용 ref
  const sentinelRef = useRef(null); // 감시 대상 요소(신호 역할)의 ref

  const navigate = useNavigate();

  // -------------------- 데이터 로딩 함수 --------------------
  /**
   * @param {number} pageNumber - 불러올 페이지 번호
   * @param {string} catParam - 새 카테고리 (있다면), 없으면 selectedCategory 사용
   * @param {string} methodParam - 새 조리방법 (있다면), 없으면 selectedCookingMethod 사용
   */
  const loadFoods = useCallback(
    async (pageNumber, catParam, methodParam) => {
      try {
        // 인자로 받은 값이 있으면 우선 사용, 없으면 상태값 사용
        let finalCategory =
          catParam !== undefined ? catParam : selectedCategory;
        let finalMethod =
          methodParam !== undefined ? methodParam : selectedCookingMethod;

        // 필터 타입에 따라 필요없는 필드는 빈 문자열 처리
        if (selectedFilterType === "카테고리") {
          finalMethod = "";
        } else {
          finalCategory = "";
        }

        const response = await fetchFoodList(
          query,
          finalCategory,
          finalMethod,
          pageNumber,
          20
        );
        console.log("loadFoods 응답:", response);

        if (pageNumber === 1) {
          setFoods(response);
        } else {
          setFoods((prev) => [...prev, ...response]);
        }

        if (!response || response.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (error) {
        console.error("음식 레시피 목록 조회 중 에러:", error);
      }
    },
    [query, selectedCategory, selectedCookingMethod, selectedFilterType]
  );

  // -------------------- 검색/필터 버튼 클릭 시 --------------------
  const handleSearch = useCallback(() => {
    setPage(1);
    loadFoods(1);
    resetObserver();
  }, [loadFoods]);

  // -------------------- Intersection Observer 콜백 --------------------
  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore]
  );

  // -------------------- Observer 재설정 (React ref 사용) --------------------
  const resetObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    observerRef.current = observer;
  }, [handleObserver]);

  // -------------------- page 변경 시 추가 로딩 --------------------
  useEffect(() => {
    if (page > 1) {
      loadFoods(page);
    }
  }, [page, loadFoods]);

  // -------------------- 컴포넌트 마운트 시 Observer 설정 --------------------
  useEffect(() => {
    resetObserver();
    // 첫 페이지 데이터 로딩
    loadFoods(1);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [resetObserver, loadFoods]);

  // -------------------- 상세 페이지 이동 --------------------
  const handleSelectFood = (id) => {
    navigate(`/foodrecipes/${id}`);
  };

  // -------------------- 예시 추천 레시피 --------------------
  const recommendedRecipes = [
    { id: "rec_1", name: "비빔밥", image: placeholder2 },
    { id: "rec_2", name: "김치찌개", image: placeholder2 },
    { id: "rec_3", name: "불고기", image: placeholder2 },
  ];

  // -------------------- 필터 옵션 --------------------
  const filterTypes = ["카테고리", "조리방법"];
  const categories = ["전체", "반찬", "국&찌개", "일품", "후식"];
  const cookingMethods = ["전체", "찌기", "끓이기", "굽기", "기타"];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* 상단 영역 */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 text-kakiBrown dark:text-softBeige">
          Food Recipes
        </h1>
        <p className="text-kakiBrown dark:text-softBeige">
          음식 레시피를 검색하고, 마음에 드는 레시피를 확인해보세요.
        </p>
      </header>

      {/* 검색 바 섹션 */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row max-w-md mx-auto space-y-2 md:space-y-0">
          <input
            type="text"
            placeholder="Search food recipes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 border border-kakiBrown dark:border-darkKaki rounded md:rounded-r-none focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-warmOrange dark:bg-deepOrange text-white rounded md:rounded-l-none hover:bg-orange-600 dark:hover:bg-deepOrange/90"
          >
            Search
          </button>
        </div>
      </section>

      {/* 추천 레시피 섹션 */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-kakiBrown dark:text-softBeige">
          Recipes For You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedRecipes.map((item) => (
            <div
              key={item.id}
              className="border rounded overflow-hidden shadow border-kakiBrown dark:border-darkKaki"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-kakiBrown dark:text-softBeige">
                  {item.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 필터 타입 선택 섹션 */}
      <section className="mb-8 text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-kakiBrown dark:text-softBeige">
          원하는 필터 유형을 선택하세요
        </h2>
        <div className="flex justify-center mb-4">
          <select
            value={selectedFilterType}
            onChange={(e) => {
              setSelectedFilterType(e.target.value);
              setSelectedCategory("");
              setSelectedCookingMethod("");
              setPage(1);
              loadFoods(1); // 필터 변경 시 첫 페이지 로드
              resetObserver();
            }}
            className="p-2 border rounded border-kakiBrown dark:border-darkKaki"
          >
            {filterTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {selectedFilterType === "카테고리"
            ? categories.map((cat) => {
                const newCat = cat === "전체" ? "" : cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(newCat);
                      setSelectedCookingMethod("");
                      setPage(1);
                      loadFoods(1, newCat, undefined);
                      resetObserver();
                    }}
                    className={`px-4 py-2 border rounded transition-colors ${
                      selectedCategory === cat ||
                      (cat === "전체" && selectedCategory === "")
                        ? "bg-warmOrange dark:bg-deepOrange text-white"
                        : "bg-white dark:bg-transparent text-kakiBrown dark:text-softBeige border-kakiBrown dark:border-darkKaki hover:bg-warmOrange dark:hover:bg-deepOrange"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })
            : cookingMethods.map((method) => {
                const newMethod = method === "전체" ? "" : method;
                return (
                  <button
                    key={method}
                    onClick={() => {
                      setSelectedCookingMethod(newMethod);
                      setSelectedCategory("");
                      setPage(1);
                      loadFoods(1, undefined, newMethod);
                      resetObserver();
                    }}
                    className={`px-4 py-2 border rounded transition-colors ${
                      selectedCookingMethod === method ||
                      (method === "전체" && selectedCookingMethod === "")
                        ? "bg-warmOrange dark:bg-deepOrange text-white"
                        : "bg-white dark:bg-transparent text-kakiBrown dark:text-softBeige border-kakiBrown dark:border-darkKaki hover:bg-warmOrange dark:hover:bg-deepOrange"
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
        </div>
      </section>

      {/* 레시피 목록 섹션 */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-kakiBrown dark:text-softBeige">
          Our Recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {foods.map((food) => (
            <div
              key={food.id}
              className="border border-kakiBrown dark:border-darkKaki rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer transition-transform transform hover:scale-105"
              onClick={() => handleSelectFood(food.id)}
            >
              <img
                src={food.image || placeholder2}
                alt={food.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-kakiBrown dark:text-softBeige">
                  {food.name}
                </h3>
                <p className="text-kakiBrown dark:text-softBeige">
                  Category: {food.category}
                </p>
                <p className="text-kakiBrown dark:text-softBeige">
                  Likes: {food.like || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* sentinel 요소: ref를 부여하여 Intersection Observer가 감시 */}
      {hasMore && <div ref={sentinelRef} style={{ height: "50px" }} />}
    </div>
  );
};

export default FoodListPage;
