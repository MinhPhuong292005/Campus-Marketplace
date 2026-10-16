package com.ioc.internship.service.impl;

import com.ioc.internship.dto.response.CampusRes;
import com.ioc.internship.dto.response.CategoryRes;
import com.ioc.internship.dto.response.UniversityRes;
import com.ioc.internship.entity.CampusEntity;
import com.ioc.internship.entity.CategoryEntity;
import com.ioc.internship.entity.UniversityEntity;
import com.ioc.internship.repository.CampusRepository;
import com.ioc.internship.repository.CategoryRepository;
import com.ioc.internship.repository.UniversityRepository;
import com.ioc.internship.service.PublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicServiceImpl implements PublicService {

    private final UniversityRepository universityRepository;
    private final CampusRepository campusRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UniversityRes> getUniversities() {
        // Chỉ áp dụng cho trường Đại học Phenikaa, không nhận trường khác
        List<UniversityEntity> universities = universityRepository.findAll().stream()
                .filter(u -> "PHENIKAA".equalsIgnoreCase(u.getShortName()) || (u.getName() != null && u.getName().toLowerCase().contains("phenikaa")))
                .collect(Collectors.toList());

        return universities.stream().map(u -> UniversityRes.builder()
                .id(u.getId())
                .name(u.getName())
                .shortName(u.getShortName())
                .emailDomains(u.getEmailDomains())
                .campuses(u.getCampuses() != null ? u.getCampuses().stream().map(c -> CampusRes.builder()
                        .id(c.getId())
                        .universityId(u.getId())
                        .name(c.getName())
                        .location(c.getLocation())
                        .build()).collect(Collectors.toList()) : List.of())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CampusRes> getCampusesByUniversity(Long universityId) {
        List<CampusEntity> campuses = campusRepository.findByUniversityId(universityId);
        return campuses.stream().map(c -> CampusRes.builder()
                .id(c.getId())
                .universityId(universityId)
                .name(c.getName())
                .location(c.getLocation())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryRes> getCategories() {
        List<CategoryEntity> categories = categoryRepository.findAll();
        return categories.stream().map(cat -> CategoryRes.builder()
                .id(cat.getId())
                .name(cat.getName())
                .slug(cat.getSlug())
                .icon(cat.getIcon())
                .build()).collect(Collectors.toList());
    }
}
