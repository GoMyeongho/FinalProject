// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { getUserInfo } from "../../axios/AxiosInstanse";
// import ForumApi from "../../api/ForumApi";
// import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// import { storage } from "../../utils/FirebaseConfig";
// import {
//   CreatePostContainer,
//   CreatePostTitle,
//   CreatePostForm,
//   FormGroup,
//   CreatePostButton,
//   EditorToolbar,
// } from "../../styles/CreatePostStyles";

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
// import { toast } from "react-toastify";

// /**
//  * KR: HTML 태그 제거 및 HTML을 TipTap JSON 형식으로 변환하는 함수 (fallback용)
//  */
// const stripHTML = (html) => {
//   const tempDiv = document.createElement("div");
//   tempDiv.innerHTML = html;
//   return tempDiv.textContent || tempDiv.innerText || "";
// };

// const convertHtmlToJson = (html) => {
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
//  * KR: 게시글 생성 컴포넌트
//  */
// const CreatePost = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     title: "",
//     categoryId: "",
//     content: "",
//     contentJSON: "",
//   });
//   const [categories, setCategories] = useState([]);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [memberId, setMemberId] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [linkInput, setLinkInput] = useState("");

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
//     // onUpdate now saves both the HTML and JSON outputs into formData.
//     onUpdate: ({ editor }) => {
//       const html = editor.getHTML();
//       const json = editor.getJSON();
//       console.log("Editor 업데이트 - HTML:", html);
//       console.log("Editor 업데이트 - JSON (raw):", json);
//       // Formatted log for JSON
//       console.log(
//         "Editor 업데이트 - JSON (formatted):",
//         JSON.stringify(json, null, 2)
//       );
//       setFormData((prev) => ({
//         ...prev,
//         content: html,
//         contentJSON: JSON.stringify(json),
//       }));
//     },
//   });

//   /**
//    * KR: 사용자 정보 및 카테고리 리스트 불러오기
//    */
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const userInfo = await getUserInfo();
//         if (userInfo && userInfo.memberId) {
//           setMemberId(userInfo.memberId);
//         } else {
//           toast.error("로그인이 필요합니다.");
//           navigate("/login");
//           return;
//         }
//         const categoryData = await ForumApi.fetchCategories();
//         setCategories(categoryData);
//       } catch (error) {
//         console.error("데이터 로딩 오류:", error);
//         toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
//       }
//     };

//     fetchData();
//   }, [navigate]);

//   /**
//    * KR: 폼 데이터 변경 처리
//    */
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   /**
//    * KR: 파일 선택 처리
//    */
//   const handleFileChange = (e) => {
//     setSelectedFile(e.target.files[0]);
//   };

//   /**
//    * KR: 게시글 생성 처리
//    *
//    * 여기서는 폼 제출 시 에디터에서 최신 TipTap JSON을 직접 가져와서 payload에 포함시킵니다.
//    */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setUploading(true);

//     const currentJSON = editor
//       ? JSON.stringify(editor.getJSON())
//       : formData.contentJSON;

//     // Log the content type and value before submission
//     console.log("폼 제출 시 formData:", formData);
//     console.log("폼 제출 시 currentJSON (raw):", currentJSON);
//     try {
//       const parsedJSON = JSON.parse(currentJSON);
//       console.log(
//         "폼 제출 시 currentJSON (parsed, formatted):",
//         JSON.stringify(parsedJSON, null, 2)
//       );
//     } catch (e) {
//       console.warn("폼 제출 시 currentJSON parsing error:", e);
//     }

//     if (!formData.content || formData.content === "<p></p>") {
//       toast.error("내용을 입력해주세요.");
//       setUploading(false);
//       return;
//     }

//     let fileUrl = null;
//     try {
//       if (!memberId) {
//         toast.error("로그인이 필요합니다.");
//         navigate("/login");
//         return;
//       }
//       if (selectedFile) {
//         console.log("파일 선택됨:", selectedFile);
//         const storageRef = ref(storage, `forum_files/${selectedFile.name}`);
//         await uploadBytes(storageRef, selectedFile);
//         fileUrl = await getDownloadURL(storageRef);
//         console.log("업로드된 파일 URL:", fileUrl);
//       }
//       const postData = {
//         ...formData,
//         memberId,
//         fileUrls: fileUrl ? [fileUrl] : [],
//         contentJSON: currentJSON, // ensure valid TipTap JSON is sent
//       };

//       console.log("최종 postData:", postData);
//       const response = await ForumApi.createPost(postData);
//       console.log("API 응답:", response);
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
//    * KR: 링크 추가 모달 열기 (폼 제출 방지)
//    */
//   const openLinkModal = (e) => {
//     e.preventDefault();
//     setIsModalOpen(true);
//   };

//   /**
//    * KR: 링크 추가 확인 처리
//    */
//   const handleAddLink = (url) => {
//     if (!url) return;
//     editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
//     setIsModalOpen(false);
//   };

//   return (
//     <CreatePostContainer>
//       <CreatePostTitle>게시글 생성</CreatePostTitle>
//       <CreatePostForm onSubmit={handleSubmit}>
//         <FormGroup>
//           <label htmlFor="title">제목</label>
//           <input
//             type="text"
//             id="title"
//             name="title"
//             value={formData.title}
//             onChange={handleChange}
//             required
//           />
//         </FormGroup>

//         <FormGroup>
//           <label htmlFor="categoryId">카테고리</label>
//           <select
//             id="categoryId"
//             name="categoryId"
//             value={formData.categoryId}
//             onChange={handleChange}
//             required
//           >
//             <option value="">카테고리를 선택하세요</option>
//             {categories.map((category) => (
//               <option key={category.id} value={category.id}>
//                 {category.title}
//               </option>
//             ))}
//           </select>
//         </FormGroup>

//         {/* KR: Tiptap 에디터 및 툴바 */}
//         <FormGroup>
//           <label>내용</label>
//           <EditorToolbar>
//             <button
//               type="button"
//               onClick={() => editor.chain().focus().toggleBold().run()}
//             >
//               B
//             </button>
//             <button
//               type="button"
//               onClick={() => editor.chain().focus().toggleItalic().run()}
//             >
//               I
//             </button>
//             <button
//               type="button"
//               onClick={() => editor.chain().focus().toggleUnderline().run()}
//             >
//               U
//             </button>
//             <button type="button" onClick={openLinkModal}>
//               Link
//             </button>
//             <button
//               type="button"
//               onClick={() => editor.chain().focus().unsetLink().run()}
//             >
//               Remove Link
//             </button>
//           </EditorToolbar>
//           <EditorContent editor={editor} className="editor" />
//         </FormGroup>

//         <FormGroup>
//           <label htmlFor="file">파일 첨부 (선택 사항)</label>
//           <input type="file" id="file" onChange={handleFileChange} />
//         </FormGroup>

//         <CreatePostButton type="submit" disabled={uploading}>
//           {uploading ? "업로드 중..." : "게시글 생성"}
//         </CreatePostButton>
//       </CreatePostForm>

//       {/* KR: 링크 추가 모달 */}
//       <ConfirmationModal
//         isOpen={isModalOpen}
//         type="addLink"
//         message="추가할 링크를 입력하세요:"
//         onConfirm={handleAddLink}
//         onCancel={() => setIsModalOpen(false)}
//       />
//     </CreatePostContainer>
//   );
// };

// export default CreatePost;
