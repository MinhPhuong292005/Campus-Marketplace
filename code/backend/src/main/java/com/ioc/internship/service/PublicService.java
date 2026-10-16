package com.ioc.internship.service;

import com.ioc.internship.dto.response.CampusRes;
import com.ioc.internship.dto.response.CategoryRes;
import com.ioc.internship.dto.response.UniversityRes;

import java.util.List;

public interface PublicService {
    List<UniversityRes> getUniversities();
    List<CampusRes> getCampusesByUniversity(Long universityId);
    List<CategoryRes> getCategories();
}
