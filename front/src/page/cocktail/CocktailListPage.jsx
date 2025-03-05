import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCocktailList } from "../../api/CocktailApi";
import placeholder from "./style/placeholder.jpg";
import placeholder2 from "./style/placeholder2.png";

/**
 * 칵테일 목록 페이지
 * - 검색어와 카테고리 필터를 적용
 * - Intersection Observer와 React ref를 사용해 무한 스크롤 구현
 * - 카테고리 클릭 시 인자로 직접 전달해 "두 번 클릭" 문제 해결
 */
const CocktailListPage = () => {
  // -------------------- 상태 변수 --------------------
  const [cocktails, setCocktails] = useState([]); // 칵테일 목록
  const [query, setQuery] = useState(""); // 검색어
  const [selectedCategory, setSelectedCategory] = useState(""); // 카테고리

  // 무한 스크롤 관련
  const [page, setPage] = useState(1); // 현재 페이지 번호
  const [hasMore, setHasMore] = useState(true); // 추가 데이터 여부
  const observerRef = useRef(null); // IntersectionObserver 저장용 ref
  const sentinelRef = useRef(null); // 감시 대상 요소(ref)

  const navigate = useNavigate();

  // -------------------- 데이터 로딩 함수 --------------------
  /**
   * @param {number} pageNumber - 불러올 페이지 번호
   * @param {string} catParam - 새 카테고리 (있다면), 없으면 selectedCategory 사용
   */
  const loadCocktails = useCallback(
    async (pageNumber, catParam) => {
      try {
        const categoryUsed =
          catParam !== undefined ? catParam : selectedCategory;

        const response = await fetchCocktailList(
          query,
          "cocktail",
          categoryUsed,
          pageNumber,
          20
        );
        console.log("loadCocktails 응답:", response);

        if (pageNumber === 1) {
          setCocktails(response);
        } else {
          setCocktails((prev) => [...prev, ...response]);
        }

        if (!response || response.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (error) {
        console.error("칵테일 목록 조회 중 에러:", error);
      }
    },
    [query, selectedCategory]
  );

  // -------------------- 검색/필터 시 첫 페이지 로드 --------------------
  const fetchCocktailsData = useCallback(async () => {
    setPage(1);
    await loadCocktails(1, selectedCategory);
    resetObserver();
  }, [loadCocktails, selectedCategory]);

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

  // -------------------- page 변경 시 추가 데이터 로드 --------------------
  useEffect(() => {
    if (page > 1) {
      loadCocktails(page, selectedCategory);
    }
  }, [page, loadCocktails, selectedCategory]);

  // -------------------- 컴포넌트 마운트 시 Observer 초기화 --------------------
  useEffect(() => {
    resetObserver();
    loadCocktails(1, selectedCategory);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [resetObserver, loadCocktails]);

  // -------------------- 상세 페이지 이동 --------------------
  const handleSelectCocktail = (id) => {
    navigate(`/cocktails/${id}`);
  };

  // -------------------- 임시 추천 레시피 --------------------
  const recommendedRecipes = [
    { id: "rec_1", name: "마가리타", image: placeholder2 },
    { id: "rec_2", name: "다이키리", image: placeholder2 },
    {
      id: "rec_3",
      name: "모히또",
      image: "https://media.tenor.com/imFIc3R5UY8AAAAM/pepe-pepe-wink.gif",
    },
  ];

  // -------------------- 예시 카테고리 목록 --------------------
  const categories = [
    "전체",
    "식전 칵테일",
    "올 데이 칵테일",
    "롱드링크",
    "디저트 칵테일",
    "스파클링 칵테일",
    "식후 칵테일",
    "핫 드링크",
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* 상단 영역 */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 text-kakiBrown dark:text-softBeige">
          Cocktail Recipes
        </h1>
        <p className="text-kakiBrown dark:text-softBeige">
          칵테일 레시피를 검색하고, 마음에 드는 레시피를 확인해보세요.
        </p>
      </header>

      {/* 검색 바 섹션 */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row max-w-md mx-auto space-y-2 md:space-y-0">
          <input
            type="text"
            placeholder="Search cocktails..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 border border-kakiBrown dark:border-darkKaki rounded md:rounded-r-none focus:outline-none"
          />
          <button
            onClick={() => {
              setPage(1);
              loadCocktails(1, selectedCategory);
              resetObserver();
            }}
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

      {/* 카테고리 필터 섹션 */}
      <section className="mb-8 text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-kakiBrown dark:text-softBeige">
          원하는 카테고리를 선택하세요
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => {
            const newCat = cat === "전체" ? "" : cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(newCat);
                  setPage(1);
                  loadCocktails(1, newCat, undefined);
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
          })}
        </div>
      </section>

      {/* 레시피 목록 섹션 */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-kakiBrown dark:text-softBeige">
          Our Recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cocktails.map((food) => (
            <div
              key={food.id}
              className="border border-kakiBrown dark:border-darkKaki rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer transition-transform transform hover:scale-105"
              onClick={() => navigate(`/cocktails/${food.id}`)}
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

      {/* sentinel 요소: React ref를 사용 */}
      {hasMore && <div ref={sentinelRef} style={{ height: "50px" }} />}
    </div>
  );
};

export default CocktailListPage;
