package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.service.FileUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadServiceImpl implements FileUploadService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image
    private static final long MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB for short video
    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp", ".mp4", ".webm", ".mov");
    private final Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();

    public FileUploadServiceImpl() {
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            log.error("Failed to initialize upload directory: {}", e.getMessage());
        }
    }

    @Override
    public String uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Tệp tải lên không được để trống");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf(".");
        if (dotIdx > -1) {
            extension = originalFilename.substring(dotIdx).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Định dạng tệp \"" + extension + "\" không được hỗ trợ! Chỉ chấp nhận hình ảnh (.jpg, .jpeg, .png, .webp) và video (.mp4, .webm, .mov). Không hỗ trợ tệp nén hoặc slide/tài liệu (.zip, .pptx, .pdf, .docx,...)");
        }

        String contentType = file.getContentType();
        if (contentType != null) {
            String lowerType = contentType.toLowerCase();
            boolean isValidMime = lowerType.startsWith("image/") || lowerType.startsWith("video/") || lowerType.equals("application/octet-stream");
            if (!isValidMime) {
                throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Loại tệp không hợp lệ (" + contentType + ")! Hệ thống chỉ chấp nhận tệp hình ảnh hoặc video ngắn.");
            }
        }

        boolean isVideo = extension.equals(".mp4") || extension.equals(".webm") || extension.equals(".mov");
        long maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.getSize() > maxSize) {
            String limitMsg = isVideo ? "Dung lượng video vượt quá 25MB" : "Dung lượng hình ảnh vượt quá 5MB";
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST, limitMsg);
        }

        String uniqueFileName = UUID.randomUUID().toString() + extension;
        Path targetLocation = uploadPath.resolve(uniqueFileName);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/api/v1/public/uploads/" + uniqueFileName;
        } catch (IOException ex) {
            log.error("Could not upload file: {}", ex.getMessage());
            throw new CustomBusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
