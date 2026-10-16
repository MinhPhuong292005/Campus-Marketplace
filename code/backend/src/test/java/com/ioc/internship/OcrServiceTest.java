package com.ioc.internship;

import com.ioc.internship.dto.request.StudentCardVerifyReq;
import com.ioc.internship.dto.response.StudentCardVerifyRes;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.impl.OcrServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OcrServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OcrServiceImpl ocrService;

    private UserEntity user;

    @BeforeEach
    void setUp() {
        user = UserEntity.builder()
                .fullName("Nguyễn Văn An")
                .studentCode("20201234")
                .studentCardVerified(false)
                .karmaScore(20)
                .build();
        user.setId(1L);
    }

    @Test
    @DisplayName("ST-11.1: Quét OCR thẻ sinh viên đạt độ tin cậy > 90%, tự động duyệt và cộng +15 điểm Karma")
    void testVerifyStudentCardSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(i -> i.getArgument(0));

        StudentCardVerifyReq req = StudentCardVerifyReq.builder()
                .frontImageUrl("https://res.cloudinary.com/front-card.jpg")
                .backImageUrl("https://res.cloudinary.com/back-card.jpg")
                .build();

        StudentCardVerifyRes res = ocrService.verifyStudentCard(1L, req);

        assertNotNull(res);
        assertTrue(res.getAutoApproved());
        assertTrue(res.getConfidenceScore() >= 90.0);
        assertEquals(15, res.getKarmaAwarded());
        assertTrue(user.getStudentCardVerified());
        assertEquals(35, user.getKarmaScore()); // 20 + 15
        verify(userRepository, times(1)).save(user);
    }
}
