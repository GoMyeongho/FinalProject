import axiosInstance from "./AxiosInstance";

const ProfileApi = {
  getProfile: () => {
    return axiosInstance.get("/api/profile/get");
  },

  getProfileCard: (userId: string) => {
    return axiosInstance.get(`/api/profile/${userId}`);
  },

  // 프로필 수정 요청
  updateProfileInfo: (profileData: { nickName: string; introduce: string }) => {
    return axiosInstance.put("/api/profile/info", profileData);
  },

  // 프로필 이미지 업로드 요청
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return axiosInstance.post("/api/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default ProfileApi;
