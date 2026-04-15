package com.projectmanager.repository;

import com.projectmanager.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    boolean existsByProjectType(String projectType);
    List<Project> findByCategoryIdIsNull();
}
