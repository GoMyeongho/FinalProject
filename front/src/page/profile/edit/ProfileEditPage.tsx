import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/AxiosInstance";
import { CgProfile } from "react-icons/cg";
import {
  Container,
  ProfileImageWrapper,
  ProfileImage,
  UploadButton,
  UploadIcon,
  ProfileImagePlaceholder,
  InputWrapper,
  Label,
  Input,
  Button,
} from "./ProfileEditStyles";
import ProfileApi from "../../../api/ProfileApi";

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    nickName: "",
    introduce: "",
    memberImg: "", // 프로필 이미지 URL
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // 이미지 미리보기 URL

  // 프로필 데이터 로드
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await ProfileApi.getProfile();
        console.log("Response:", response); // 전체 응답 확인 (디버깅 가능)

        setProfile({
          nickName: response.data.nickName,
          introduce: response.data.introduce,
          memberImg: response.data.memberImg,
        });
        setPreview(response.data.memberImg);
      } catch (error) {
        console.error("프로필 정보를 가져오는 데 실패했습니다.", error);
      }
    };

    fetchProfile();
  }, []);

  // 이미지 파일 변경 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFile(file);

      // 선택한 이미지의 미리보기 URL 생성
      const fileURL = URL.createObjectURL(file);
      setPreview(fileURL);
    }
  };
  // 프로필 수정 요청
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const promises = [];

      // 파일 업로드 처리
      if (file) {
        promises.push(ProfileApi.uploadProfileImage(file)); // 이미지 업로드 요청
      }

      // 프로필 수정 요청을 promises 배열에 추가
      promises.push(ProfileApi.updateProfileInfo(profile)); // 프로필 수정 요청

      // 두 요청을 동시에 처리
      await Promise.all(promises);

      alert("프로필이 성공적으로 수정되었습니다.");
      navigate("/profile");
    } catch (error) {
      console.error("프로필 수정에 실패했습니다.", error);
      alert("프로필 수정에 실패했습니다.");
    }
  };

  // 필드 값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value, // 값이 비어 있으면 기존 값 유지
    }));
  };
  return (
    <Container>
      <h1>프로필 수정</h1>
      <form onSubmit={handleSubmit}>
        <ProfileImageWrapper>
          {preview ? (
            <ProfileImage src={preview} alt="Profile Preview" />
          ) : (
            <CgProfile size={50} color="#ccc" />
          )}
          <UploadButton>
            <UploadIcon />
            <input
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </UploadButton>
        </ProfileImageWrapper>

        <Label htmlFor="nickName">닉네임</Label>
        <Input
          type="text"
          id="nickName"
          name="nickName"
          value={profile.nickName}
          onChange={handleChange}
          placeholder="닉네임을 입력하세요"
        />

        <Label htmlFor="introduce">자기소개</Label>
        <Input
          type="text"
          id="introduce"
          name="introduce"
          value={profile.introduce}
          onChange={handleChange}
          placeholder="자기소개를 입력하세요"
        />

        <Button type="submit">수정</Button>
        <Button type="button" onClick={() => navigate("/profile")}>
          취소
        </Button>
      </form>
    </Container>
  );
};

export default ProfileEditPage;
