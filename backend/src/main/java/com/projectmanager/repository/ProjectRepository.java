package com.projectmanager.repository;

import com.projectmanager.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    boolean existsByProjectType(String projectType);
    long countByCategoryId(String categoryId);
    List<Project> findByCategoryIdIsNull();

    @Query("SELECT p FROM Project p WHERE p.categoryId IS NULL OR TRIM(p.categoryId) = ''")
    List<Project> findByCategoryIdNullOrEmpty();
    List<Project> findByProjectStatus(String projectStatus);

    /** Admin / portfolioFull kullanıcılar için — tüm projeleri filtrele */
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

    /** Yetki kısıtlı kullanıcılar: POTANSIYEL projeler + izin verilen ID listesi */
    @Query("SELECT p FROM Project p WHERE " +
           "(:categoryId IS NULL OR p.categoryId = :categoryId) AND " +
           "(:status IS NULL OR p.projectStatus = :status) AND " +
           "(:excludeStatus IS NULL OR p.projectStatus <> :excludeStatus) AND " +
           "(p.projectStatus = 'POTANSIYEL' OR p.id IN :allowedIds)")
    Page<Project> findByFiltersAndAccess(
        @Param("categoryId") String categoryId,
        @Param("status") String status,
        @Param("excludeStatus") String excludeStatus,
        @Param("allowedIds") Collection<String> allowedIds,
        Pageable pageable
    );
}
