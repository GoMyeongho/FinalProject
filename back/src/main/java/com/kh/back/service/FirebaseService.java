package com.kh.back.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.cloud.storage.Storage;
import com.google.firebase.cloud.StorageClient;
import com.kh.back.entity.member.Member;
import com.kh.back.repository.member.MemberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
public class FirebaseService {

    private final MemberRepository memberRepository;

    public FirebaseService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    // 이미지 리사이징, 압축 후 레시피 이름 폴더로 업로드
    public String uploadImage(MultipartFile file, String recipeName) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 없습니다.");
        }

        // 레시피 이름을 폴더명으로 사용 (공백 제거)
        String folderName = "recipes/" + recipeName.replaceAll("\\s+", "_");

        // 원본 파일 확장자 가져오기
        String originalFilename = file.getOriginalFilename();
        String extension = "jpg"; // 기본 확장자
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        // 파일을 BufferedImage로 변환
        BufferedImage originalImage = ImageIO.read(file.getInputStream());

        // 400x400으로 리사이징
        BufferedImage resizedImage = new BufferedImage(400, 400, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = resizedImage.createGraphics();
        g.drawImage(originalImage, 0, 0, 400, 400, null);
        g.dispose();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(resizedImage, extension, outputStream);
        byte[] imageBytes = outputStream.toByteArray();

        // Firebase Storage에 업로드
        Bucket bucket = StorageClient.getInstance().bucket();
        String fileName = folderName + "/" + UUID.randomUUID() + "_" + originalFilename; // 폴더 경로 추가
        Blob blob = bucket.create(fileName, imageBytes, "image/" + extension);

        // ✅ 공개 URL 반환
        return "https://firebasestorage.googleapis.com/v0/b/" + bucket.getName() + "/o/"
                + URLEncoder.encode(fileName, StandardCharsets.UTF_8) + "?alt=media";
    }


    public static String uploadProfileImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 없습니다.");
        }

        // 프로필 이미지 저장 경로 설정
        String folderName = "profile/";

        // 파일을 BufferedImage로 변환
        BufferedImage originalImage = ImageIO.read(file.getInputStream());

        // 400x400으로 리사이징
        BufferedImage resizedImage = new BufferedImage(400, 400, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resizedImage.createGraphics();
        g.drawImage(originalImage, 0, 0, 400, 400, null);
        g.dispose();

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(resizedImage, "jpg", outputStream);
        byte[] imageBytes = outputStream.toByteArray();

        // Firebase Storage에 업로드
        Bucket bucket = StorageClient.getInstance().bucket();
        String fileName = folderName + UUID.randomUUID() + "_profile.jpg"; // 파일명 고유값 추가
        Blob blob = bucket.create(fileName, imageBytes, "image/jpeg");

        // ✅ 공개 URL 반환
        return "https://firebasestorage.googleapis.com/v0/b/" + bucket.getName() + "/o/"
                + URLEncoder.encode(fileName, StandardCharsets.UTF_8) + "?alt=media";
    }

    // 본인 프로필 이미지 가져오기
    public String getProfileImage(Authentication authentication) {
        Long memberId = Long.valueOf(authentication.getName());
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        return member.getMemberImg();
    }

    // 특정 유저 프로필 이미지 가져오기
    public String getMemberProfileImage(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        return member.getMemberImg();
    }



}
