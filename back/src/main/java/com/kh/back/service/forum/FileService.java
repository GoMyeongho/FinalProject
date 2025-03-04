package com.kh.back.service.forum;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {

    public String uploadFile(MultipartFile file) {
        log.info("Uploading file: {}", file.getOriginalFilename());

        // Firebase 또는 로컬 파일 업로드 구현
        String fileUrl = "https://firebase-storage.com/" + file.getOriginalFilename();
        return fileUrl;
    }
}
