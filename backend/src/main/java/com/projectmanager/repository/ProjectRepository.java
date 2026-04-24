package com.projectmanager.repository;

import com.projectmanager.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    boolean existsByProjectType(String projectType);
    List<Project> findByCategoryIdIsNull();
    List<Project> findByProjectStatus(String projectStatus);

    @Query("SELECT p FROM Project p WHERE " +
           "(:categoryId IS NULL OR p.categoryId = :categoryId) AND " +
           "(:status IS NULL OR p.projectStatus = :status) AND " +
           "(:excludeStatus IS NULL OR p.projectStatus <> :excludeStatus)")
    Page<Project> findByFilters(
        @Param("categoryId") String categoryId,
        @Param("status") String status,
        @Param("excludeStatus") String excludeStatus,
        Pageable pageable
    );
}
