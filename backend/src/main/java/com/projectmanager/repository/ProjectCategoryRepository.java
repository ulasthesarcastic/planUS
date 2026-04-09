package com.projectmanager.repository;

import com.projectmanager.model.ProjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectCategoryRepository extends JpaRepository<ProjectCategory, String> {
    List<ProjectCategory> findAllByOrderByStepOrderAsc();
}
