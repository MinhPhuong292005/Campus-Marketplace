package com.ioc.internship;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class Application {

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(Application.class, args);
    }

    /**
     * Tự động nạp file .env vào System properties để Spring Boot và IntelliJ IDEA
     * tự động nhận diện EMAIL_USER, EMAIL_PASS, JWT_SECRET,... mà không cần cấu hình thủ công.
     */
    private static void loadDotenv() {
        java.io.File[] possibleFiles = new java.io.File[] {
                new java.io.File(".env"),
                new java.io.File("../.env"),
                new java.io.File("../../.env")
        };
        for (java.io.File file : possibleFiles) {
            if (file.exists() && file.isFile()) {
                try {
                    java.util.List<String> lines = java.nio.file.Files.readAllLines(file.toPath());
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                            continue;
                        }
                        int eqIdx = trimmed.indexOf('=');
                        String key = trimmed.substring(0, eqIdx).trim();
                        String value = trimmed.substring(eqIdx + 1).trim();
                        if ((value.startsWith("\"") && value.endsWith("\"")) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                    System.out.println(">>> [DOTENV] Đã tự động nạp cấu hình từ file: " + file.getAbsolutePath());
                    break;
                } catch (Exception e) {
                    System.err.println(">>> [DOTENV ERROR] Không thể đọc file .env: " + e.getMessage());
                }
            }
        }
    }
}

