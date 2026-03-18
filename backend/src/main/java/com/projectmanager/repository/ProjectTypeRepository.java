package com.projectmanager.repository;

import com.projectmanager.model.ProjectType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectTypeRepository extends JpaRepository<ProjectType, String> {
    boolean existsByName(String name);
}
