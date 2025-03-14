import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/AxiosInstance";
import { CgProfile } from "react-icons/cg";
import {
  ProfileCard,
  ProfileHeaderContainer,
  ProfileImageWrapper,
  ProfileImage,
  ProfileImagePlaceholder,
  ProfileInfo,
  Nickname,
  Introduce,
} from "./style/ProfileStyle";
import ProfileApi from "../../api/ProfileApi";

// 나중에 유저 id값만 넣으면 알아서 서치 할 수 있도록 하는것이 목적
const Profile = ({ userId, customStyle }) => {
  const [user, setUser] = useState({
    name: "",
    introduce: "",
    profileImg: "",
  });

  const [userStyle, setUserStyle] = useState({
    bgColor: "#ffffff",
    nicknameFont: "Arial, sans-serif",
    nicknameSize: "1.5rem",
    introduceFont: "Georgia, serif",
    introduceSize: "1rem",
    textColorNickname: "#000000", // 기본값
    textColorIntroduce: "#000000", // 기본값
  });

  useEffect(() => {
    if (userId) {
      ProfileApi.getProfileCard(userId)
        .then((response) => {
          const {
            nickName,
            memberImg,
            introduce,
            bgColor,
            nicknameFont,
            nicknameSize,
            introduceFont,
            introduceSize,
            textColorNickname,
            textColorIntroduce,
          } = response.data;

          // 유저 데이터 설정
          setUser({
            name: nickName,
            introduce: introduce,
            profileImg: memberImg,
          });

          // 스타일 설정 (없으면 기본값 사용)
          setUserStyle((prevStyle) => ({
            ...prevStyle,
            bgColor: bgColor || prevStyle.bgColor,
            nicknameFont: nicknameFont || prevStyle.nicknameFont,
            nicknameSize: nicknameSize || prevStyle.nicknameSize,
            introduceFont: introduceFont || prevStyle.introduceFont,
            introduceSize: introduceSize || prevStyle.introduceSize,
            textColorNickname: textColorNickname || prevStyle.textColorNickname,
            textColorIntroduce:
              textColorIntroduce || prevStyle.textColorIntroduce,
          }));
        })
        .catch((err) => console.error(err));
    }
  }, [userId]);

  // customStyle이 존재하면 우선 적용
  const finalStyle = { ...userStyle, ...customStyle };

  return (
    <ProfileCard
      style={{
        backgroundColor: finalStyle.bgColor,
        boxShadow: finalStyle.boxShadow,
      }}
    >
      <ProfileHeaderContainer>
        <ProfileImageWrapper>
          {user.profileImg ? (
            <ProfileImage
              src={user.profileImg}
              alt={`${user.name} 프로필 이미지`}
            />
          ) : (
            <CgProfile size={120} color="#9f8473" />
          )}
        </ProfileImageWrapper>
        <ProfileInfo>
          <Nickname
            style={{
              fontFamily: finalStyle.nicknameFont,
              fontSize: finalStyle.nicknameSize,
              color: finalStyle.textColorNickname,
            }}
          >
            {user.name}
          </Nickname>
          <Introduce
            style={{
              fontFamily: finalStyle.introduceFont,
              fontSize: finalStyle.introduceSize,
              color: finalStyle.textColorIntroduce,
            }}
          >
            {user.introduce}
          </Introduce>
        </ProfileInfo>
      </ProfileHeaderContainer>
    </ProfileCard>
  );
};

export default Profile;
