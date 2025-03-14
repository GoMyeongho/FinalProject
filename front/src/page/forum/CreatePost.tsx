// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux"; // 추가: Redux dispatch 사용
// import ReduxApi from "../../api/ReduxApi";
// import ForumApi from "../../api/ForumApi";
// import { toast } from "react-toastify";

// // 📝 TipTap Editor 관련 라이브러리
// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Bold from "@tiptap/extension-bold";
// import Italic from "@tiptap/extension-italic";
// import Underline from "@tiptap/extension-underline";
// import Link from "@tiptap/extension-link";
// import TextStyle from "@tiptap/extension-text-style";
// import Blockquote from "@tiptap/extension-blockquote";
// import ConfirmationModal from "./ConfirmationModal";

// // Redux 로그인 모달 액션 임포트
// import { openModal } from "../../context/redux/ModalReducer";

// // -----------------------------------------------
// // 타입 정의
// // -----------------------------------------------
// interface MyInfo {
//   id: number;
//   email: string;
//   nickname: string;
//   role: "ROLE_ADMIN" | "ROLE_USER";
// }

// interface FormDataType {
//   title: string;
//   categoryId: string;
//   content: string;
//   contentJSON: string;
// }

// interface Category {
//   id: string;
//   title: string;
// }

// // -----------------------------------------------
// // HTML 태그 제거 및 TipTap JSON 형식으로 변환 (fallback용)
// // -----------------------------------------------
// const stripHTML = (html: string): string => {
//   const tempDiv = document.createElement("div");
//   tempDiv.innerHTML = html;
//   return tempDiv.textContent || tempDiv.innerText || "";
// };

// const convertHtmlToJson = (html: string) => {
//   const plainText = stripHTML(html);
//   return {
//     type: "doc",
//     content: [
//       {
//         type: "paragraph",
//         content: [{ type: "text", text: plainText }],
//       },
//     ],
//   };
// };

// /**
//  * 게시글 생성 컴포넌트 (CreatePost)
//  * - 사용자가 게시글 제목, 카테고리, 내용을 입력하면 데이터를 백엔드에 전송합니다.
//  * - TipTap 에디터를 사용하여 내용을 입력하고, HTML 및 JSON 형식으로 저장합니다.
//  */
// const CreatePost: React.FC = () => {
//   const navigate = useNavigate();
//   const dispatch = useDispatch(); // Redux dispatch 훅 추가

//   // 게시글 폼 데이터 상태
//   const [formData, setFormData] = useState<FormDataType>({
//     title: "",
//     categoryId: "",
//     content: "",
//     contentJSON: "",
//   });
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState<boolean>(false);
//   // ReduxApi.getMyInfo에서 받은 id를 문자열로 변환하여 저장
//   const [memberId, setMemberId] = useState<string | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [linkInput, setLinkInput] = useState<string>("");

//   // 📝 TipTap Editor 설정
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Bold,
//       Italic,
//       Underline,
//       Link.configure({ openOnClick: false }),
//       TextStyle,
//       Blockquote,
//     ],
//     content: "",
//     onUpdate: ({ editor }) => {
//       const html = editor.getHTML();
//       const json = editor.getJSON();
//       console.log("Editor 업데이트 - HTML:", html);
//       console.log("Editor 업데이트 - JSON (raw):", json);
//       console.log(
//         "Editor 업데이트 - JSON (formatted):",
//         JSON.stringify(json, null, 2)
//       );
//       // 만약 JSON 내용이 비어있다면 기본값을 사용하도록 처리
//       setFormData((prev) => ({
//         ...prev,
//         content: html,
//         contentJSON:
//           JSON.stringify(json) || JSON.stringify({ type: "doc", content: [] }),
//       }));
//     },
//   });

//   /**
//    * 사용자 정보 및 카테고리 리스트를 불러오는 함수
//    * KR: ReduxApi.getMyInfo를 통해 사용자 정보를 받고,
//    *     ForumApi.fetchCategories로 카테고리 목록을 받아옵니다.
//    */
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await ReduxApi.getMyInfo();
//         // 반환되는 MyInfo 객체는 { id, email, nickname, role } 구조입니다.
//         const userInfo: MyInfo = response.data;
//         if (userInfo && userInfo.id) {
//           setMemberId(userInfo.id.toString());
//         } else {
//           toast.error("로그인이 필요합니다.");
//           // 로그인 페이지 대신 로그인 모달 열기
//           dispatch(openModal("login"));
//           return;
//         }
//         const categoryData = await ForumApi.fetchCategories();
//         setCategories(categoryData as Category[]);
//       } catch (error) {
//         console.error("데이터 로딩 오류:", error);
//         toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
//         // 오류 발생 시에도 로그인 모달 열기
//         dispatch(openModal("login"));
//       }
//     };
//     fetchData();
//   }, [navigate, dispatch]);

//   /**
//    * 폼 데이터 변경 처리 함수
//    */
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   /**
//    * 파일 선택 처리 함수 (현재는 주석 처리된 상태)
//    */
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setSelectedFile(e.target.files[0]);
//     }
//   };

//   /**
//    * 게시글 생성 처리 함수
//    * KR: 이제 ForumApi.createPostAndFetch를 사용하여 게시글 생성 후 전체 상세 정보를 바로 조회합니다.
//    */
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setUploading(true);

//     // 에디터의 최신 JSON 내용을 사용합니다.
//     const currentJSON = editor
//       ? JSON.stringify(editor.getJSON())
//       : formData.contentJSON || JSON.stringify({ type: "doc", content: [] });
//     console.log("폼 제출 시 formData:", formData);
//     console.log("폼 제출 시 currentJSON (raw):", currentJSON);
//     try {
//       const parsedJSON = JSON.parse(currentJSON);
//       console.log(
//         "폼 제출 시 currentJSON (parsed, formatted):",
//         JSON.stringify(parsedJSON, null, 2)
//       );
//     } catch (e) {
//       console.warn("폼 제출 시 currentJSON 파싱 에러:", e);
//     }

//     if (!formData.content || formData.content === "<p></p>") {
//       toast.error("내용을 입력해주세요.");
//       setUploading(false);
//       return;
//     }

//     // 파일 업로드 관련 로직은 추후 협의되므로 주석 처리합니다.
//     /*
//     let fileUrl: string | null = null;
//     try {
//       if (!memberId) {
//         toast.error("로그인이 필요합니다.");
//         dispatch(openModal("login")); // 로그인 모달 열기
//         return;
//       }
//       if (selectedFile) {
//         console.log("파일 선택됨:", selectedFile);
//         // 파일 업로드 로직 처리...
//       }
//     } catch (error) {
//       console.error("파일 업로드 중 오류:", error);
//     }
//     */

//     // 최종 게시글 데이터 구성 (contentJSON이 없는 경우 기본값 사용)
//     const postData = {
//       ...formData,
//       memberId,
//       fileUrls: [],
//       contentJSON: currentJSON || JSON.stringify({ type: "doc", content: [] }),
//     };

//     console.log("최종 postData:", postData);
//     try {
//       const response = await ForumApi.createPostAndFetch(postData);
//       console.log("전체 게시글 데이터:", response);
//       toast.success("게시글이 성공적으로 생성되었습니다!");
//       navigate(`/forum/post/${response.id}`);
//     } catch (error) {
//       console.error("게시글 생성 중 오류:", error);
//       toast.error("게시글 생성에 실패했습니다.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   /**
//    * 링크 추가 모달 열기 (폼 제출 방지)
//    */
//   const openLinkModal = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     setIsModalOpen(true);
//   };

//   /**
//    * 링크 추가 확인 처리 함수
//    */
//   const handleAddLink = (url: string) => {
//     if (!url) return;
//     editor
//       ?.chain()
//       .focus()
//       .extendMarkRange("link")
//       .setLink({ href: url })
//       .run();
//     setIsModalOpen(false);
//   };

//   return (
//     // TailwindCSS 적용: 모바일은 full width, 데스크탑에서는 최대 1200px로 중앙 정렬합니다.
//     <div className="bg-gray-100 w-full md:max-w-[1200px] mx-auto my-10 p-6 rounded-lg shadow-md">
//       <h2 className="text-3xl font-bold text-center mb-6">게시글 생성</h2>
//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         {/* 제목 입력 */}
//         <div className="flex flex-col gap-1">
//           <label htmlFor="title" className="font-semibold text-gray-700">
//             제목
//           </label>
//           <input
//             type="text"
//             id="title"
//             name="title"
//             value={formData.title}
//             onChange={handleChange}
//             required
//             className="p-2 border border-gray-300 rounded"
//           />
//         </div>

//         {/* 카테고리 선택 */}
//         <div className="flex flex-col gap-1">
//           <label htmlFor="categoryId" className="font-semibold text-gray-700">
//             카테고리
//           </label>
//           <select
//             id="categoryId"
//             name="categoryId"
//             value={formData.categoryId}
//             onChange={handleChange}
//             required
//             className="p-2 border border-gray-300 rounded"
//           >
//             <option value="">카테고리를 선택하세요</option>
//             {categories.map((category) => (
//               <option key={category.id} value={category.id}>
//                 {category.title}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* TipTap 에디터 및 툴바 */}
//         <div className="flex flex-col gap-2">
//           <label className="font-semibold text-gray-700">내용</label>
//           <div className="flex gap-2 mb-2">
//             <button
//               type="button"
//               onClick={() => editor?.chain().focus().toggleBold().run()}
//               className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               B
//             </button>
//             <button
//               type="button"
//               onClick={() => editor?.chain().focus().toggleItalic().run()}
//               className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               I
//             </button>
//             <button
//               type="button"
//               onClick={() => editor?.chain().focus().toggleUnderline().run()}
//               className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               U
//             </button>
//             <button
//               type="button"
//               onClick={openLinkModal}
//               className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Link
//             </button>
//             <button
//               type="button"
//               onClick={() => editor?.chain().focus().unsetLink().run()}
//               className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Remove Link
//             </button>
//           </div>
//           <EditorContent
//             editor={editor}
//             className="border border-gray-300 rounded p-2 min-h-[200px] bg-white"
//           />
//         </div>

//         {/* 파일 첨부 (선택 사항) */}
//         <div className="flex flex-col gap-1">
//           <label htmlFor="file" className="font-semibold text-gray-700">
//             파일 첨부 (선택 사항)
//           </label>
//           <input
//             type="file"
//             id="file"
//             onChange={handleFileChange}
//             className="p-2 border border-gray-300 rounded"
//           />
//         </div>

//         {/* 제출 버튼 */}
//         <button
//           type="submit"
//           disabled={uploading}
//           className={`py-2 rounded font-semibold ${
//             uploading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
//           } text-white`}
//         >
//           {uploading ? "업로드 중..." : "게시글 생성"}
//         </button>
//       </form>

//       {/* 링크 추가 모달 (ConfirmationModal) */}
//       <ConfirmationModal
//         isOpen={isModalOpen}
//         type="addLink"
//         content={""} // 필수 prop, 여기서는 빈 문자열 전달
//         message="추가할 링크를 입력하세요:"
//         onConfirm={handleAddLink}
//         onCancel={() => setIsModalOpen(false)}
//       />
//     </div>
//   );
// };

// export default CreatePost;
