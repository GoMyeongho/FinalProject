import { useState, ChangeEvent } from "react";
import { Upload } from "lucide-react"; // 설치 필요
import React from "react";
import RecipeApi from "../../api/RecipeApi";

// 재료와 조리법의 타입 정의
interface Ingredient {
  ingredient: string;
  amount: string;
}

interface Step {
  text: string;
  image: File | null;
}


const AddRecipeDetail = () => {
  const [title, setTitle] = useState<string>("");
  const [cookingMethod, setCookingMethod] = useState<string>("");
  const [recipeTip, setRecipeTip] = useState<string>("");
  const [cuisineType, setCuisineType] = useState<string>("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ingredient: "", amount: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ text: "", image: null }]);
  const [image, setImage] = useState<File | null>(null);

  const handleAddIngredient = () => setIngredients([...ingredients, { ingredient: "", amount: "" }]);


  const handleIngredientChange = (index: number, field: "ingredient" | "amount", value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleAddStep = () => setSteps([...steps, { text: "", image: null }]);
  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].text = value;
    setSteps(newSteps);
  };

  const handleStepImageUpload = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newSteps = [...steps];
      newSteps[index].image = file; // 파일을 직접 저장
      setSteps(newSteps);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file); // 메인 이미지를 파일로 저장
    }
  };

  const handleRemoveIngredient = () => {
    const newIngredients = ingredients.slice(0, -1); // 가장 최근 항목만 삭제
    setIngredients(newIngredients);
  };

  const handleRemoveStep = () => {
    const newSteps = steps.slice(0, -1); // 가장 최근 항목만 삭제
    setSteps(newSteps);
  };

  const handleSaveRecipe = async () => {
    const formData = new FormData();

    // 텍스트 데이터 추가
    formData.append("type", "food");
    formData.append("name", title);
    formData.append("rcpWay2", cookingMethod);
    formData.append("rcpPat2", cuisineType);
    formData.append("rcpNaTip", recipeTip);
    formData.append("authory", "1"); // 예시로 1을 사용

    // 재료 데이터 추가
    ingredients.forEach((ingredient, index) => {
      formData.append(`ingredients[${index}].ingredient`, ingredient.ingredient);
      formData.append(`ingredients[${index}].amount`, ingredient.amount);

    
    });


    // 조리 과정 데이터 추가
    steps.forEach((step, index) => {
        formData.append(`manuals[${index}].text`, step.text);
        if (step.image) {
            // 파일을 FormData에 추가
            formData.append(`manuals[${index}].imageUrl`, step.image);
        }
    });

    // 메인 이미지 추가
    if (image) {
        formData.append("attFileNoMain", image); // 파일을 FormData에 추가
    }

    try {
        const result = await RecipeApi.saveRecipe(formData);
        console.log("레시피 저장 성공:", result);
        alert("레시피가 성공적으로 저장되었습니다.");
    } catch (error) {
        console.error("레시피 저장 실패:", error);
        alert("레시피 저장 중 오류가 발생했습니다.");
    }
};

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold">음식 사진</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="upload"
        />
     
        {image && (
          <div className="border rounded-lg p-4">
            <img src={URL.createObjectURL(image)} alt="레시피 사진" className="w-full h-auto" />
          </div>
          
        )}
           <label htmlFor="upload" className="cursor-pointer flex items-center space-x-2 border p-2 rounded-lg">
          <Upload />
          <span>사진 업로드</span>
        </label>
      </div>

      <input
        type="text"
        placeholder="레시피 제목"
        value={title}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
      />
      <input
        type="text"
        placeholder="조리방법"
        value={cookingMethod}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCookingMethod(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
      />
      <input
        type="text"
        placeholder="요리 종류"
        value={cuisineType}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCuisineType(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg"
      />

      <div>
        <h2 className="text-lg font-semibold">재료</h2>
        {ingredients.map((ingredient, index) => (
          <div key={index} className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder={`재료 ${index + 1}`}
              value={ingredient.ingredient}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleIngredientChange(index, "ingredient", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder={`양 ${index + 1}`}
              value={ingredient.amount}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleIngredientChange(index, "amount", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
        <button
          onClick={handleAddIngredient}
          className="w-full py-2 bg-blue-500 text-white rounded-lg mt-2"
        >
          재료 추가
        </button>
        {ingredients.length > 1 && (
          <button
            onClick={handleRemoveIngredient}
            className="w-full py-2 bg-red-500 text-white rounded-lg mt-2"
          >
            가장 최근 재료 삭제
          </button>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-semibold">조리법</h2>
        {steps.map((step, index) => (
          <div key={index} className="space-y-2">
                
                {step.image && (
              <div className="border rounded-lg p-4">
                <img src={URL.createObjectURL(step.image)} alt={`조리 단계 ${index + 1}`} className="w-full h-auto" />
              </div>
            )}
            <textarea
              placeholder={`조리 단계 ${index + 1}`}
              value={step.text}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleStepChange(index, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleStepImageUpload(index, e)}
              className="hidden"
              id={`step-upload-${index}`}
            />
      
              <label htmlFor={`step-upload-${index}`} className="cursor-pointer flex items-center space-x-2 border p-2 rounded-lg">
              <Upload />
              <span>조리 단계 사진 업로드</span>
            </label>
          </div>
        ))}
        <button
          onClick={handleAddStep}
          className="w-full py-2 bg-blue-500 text-white rounded-lg mt-2"
        >
          조리법 추가
        </button>
        {steps.length > 1 && (
          <button
            onClick={handleRemoveStep}
            className="w-full py-2 bg-red-500 text-white rounded-lg mt-2"
          >
            가장 최근 조리법 삭제
          </button>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">레시피 팁</h2>
        <textarea
          placeholder="레시피 팁을 입력하세요"
          value={recipeTip}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRecipeTip(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>
      

      <button
        className="w-full py-2 bg-blue-500 text-white rounded-lg mt-4"
        onClick={handleSaveRecipe}
      >
        레시피 저장
      </button>
    </div>
  );
}
export default AddRecipeDetail;