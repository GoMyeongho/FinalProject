import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRecipeList } from "../../api/RecipeListApi";
import placeholder from "./style/placeholder.jpg";
import placeholder2 from "./style/placeholder2.png";
import { CocktailListResDto } from "../../api/dto/CotailListResDto";

/**
 * 칵테일 목록 페이지
 * - 검색어와 카테고리 필터를 적용합니다.
 * - Intersection Observer와 React ref를 사용해 무한 스크롤을 구현합니다.
 * - 카테고리 버튼 클릭 시 인자를 직접 전달하여 "두 번 클릭" 문제를 해결합니다.
 *
 * @returns {JSX.Element} CocktailListPage 컴포넌트
 */
const CocktailListPage: React.FC = () => {
  // -------------------- 상태 변수 --------------------
  // 칵테일 목록 상태 (CocktailListResDto 배열)
  const [cocktails, setCocktails] = useState<CocktailListResDto[]>([]);
  // 검색어 상태
  const [query, setQuery] = useState<string>("");
  // 선택된 카테고리 상태
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // -------------------- 무한 스크롤 상태 --------------------
  // 현재 페이지 번호
  const [page, setPage] = useState<number>(1);
  // 추가 데이터가 존재하는지 여부
  const [hasMore, setHasMore] = useState<boolean>(true);
  // IntersectionObserver를 저장할 ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  // 관찰 대상 요소(ref)
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 페이지 이동을 위한 navigate hook
  const navigate = useNavigate();

  /**
   * 칵테일 목록을 API로부터 불러오는 함수
   *
   * @param {number} pageNumber - 불러올 페이지 번호
   * @param {string} catParam - 새로운 카테고리 값 (선택 사항). 값이 없으면 현재 상태(selectedCategory)를 사용합니다.
   */
  const loadCocktails = useCallback(
    async (pageNumber: number, catParam?: string) => {
      try {
        // 전달된 카테고리 값이 있다면 사용하고, 그렇지 않으면 selectedCategory 사용
        const categoryUsed =
          catParam !== undefined ? catParam : selectedCategory;

        // API 호출: "cocktail" 타입을 지정하고, 조리방법 필터는 빈 문자열로 전달합니다.
        const response = await fetchRecipeList(
          query,
          "cocktail",
          categoryUsed,
          "",
          pageNumber,
          20
        );
        console.log("loadCocktails 응답:", response);

        // 첫 페이지이면 새로운 목록으로 설정, 아니면 기존 목록에 추가
        if (pageNumber === 1) {
          setCocktails(response);
        } else {
          setCocktails((prev) => [...prev, ...response]);
        }

        // 응답 데이터의 길이가 20보다 작으면 더 불러올 데이터가 없다고 판단합니다.
        setHasMore(response && response.length === 20);
      } catch (error) {
        console.error("칵테일 목록 조회 중 에러:", error);
      }
    },
    [query, selectedCategory]
  );

  /**
   * 검색 또는 필터를 적용할 때 첫 페이지 데이터를 불러오는 함수
   */
  const fetchCocktailsData = useCallback(async () => {
    setPage(1);
    await loadCocktails(1, selectedCategory);
    resetObserver();
  }, [loadCocktails, selectedCategory]);

  /**
   * IntersectionObserver의 콜백 함수
   * - 감시 대상이 화면에 나타나면 다음 페이지를 불러옵니다.
   *
   * @param {IntersectionObserverEntry[]} entries - 관찰 대상 항목 배열
   */
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore]
  );

  /**
   * IntersectionObserver를 초기화 및 재설정하는 함수
   */
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

  // 페이지 번호가 변경될 때 추가 데이터를 불러옵니다.
  useEffect(() => {
    if (page > 1) {
      loadCocktails(page, selectedCategory);
    }
  }, [page, loadCocktails, selectedCategory]);

  // 컴포넌트 마운트 시 Observer를 초기화하고, 첫 페이지 데이터를 불러옵니다.
  useEffect(() => {
    resetObserver();
    loadCocktails(1, selectedCategory);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [resetObserver, loadCocktails, selectedCategory]);

  /**
   * 상세 페이지로 이동하는 함수
   *
   * @param {string} id - 선택된 칵테일의 ID
   */
  const handleSelectCocktail = (id: string) => {
    // 상세 페이지의 라우트는 /cocktails/:id 로 구성되어 있습니다.
 
    navigate(`/cocktailrecipe/detail/${id}/cocktail`);
  };

  // -------------------- 임시 추천 레시피 데이터 (테스트용) --------------------
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
            // "전체"는 빈 문자열로 처리합니다.
            const newCat = cat === "전체" ? "" : cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(newCat);
                  setPage(1);
                  loadCocktails(1, newCat);
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

      {/* 칵테일 목록 섹션 */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-kakiBrown dark:text-softBeige">
          Our Recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cocktails.map((cocktail) => (
            <div
              key={cocktail.id}
              className="border border-kakiBrown dark:border-darkKaki rounded-lg overflow-hidden shadow hover:shadow-lg cursor-pointer transition-transform transform hover:scale-105"
              onClick={() => handleSelectCocktail(cocktail.id)}
            >
              <img
                src={cocktail.image || placeholder2}
                alt={cocktail.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-kakiBrown dark:text-softBeige">
                  {cocktail.name}
                </h3>
                <p className="text-kakiBrown dark:text-softBeige">
                  Category: {cocktail.category}
                </p>
                <p className="text-kakiBrown dark:text-softBeige">
                  Likes: {cocktail.like || 0}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Intersection Observer 감시 대상 요소 */}
      {hasMore && <div ref={sentinelRef} style={{ height: "50px" }} />}
    </div>
  );
};

export default CocktailListPage;
