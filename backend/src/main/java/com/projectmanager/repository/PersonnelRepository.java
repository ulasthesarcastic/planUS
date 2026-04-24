package com.projectmanager.repository;

import com.projectmanager.model.Personnel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PersonnelRepository extends JpaRepository<Personnel, String> {
    boolean existsBySeniorityId(String seniorityId);

    // :search parametresi Java'da önceden "%ali%" formatına getirilmeli (lower + wildcard)
    @Query("SELECT p FROM Personnel p WHERE " +
           "(:unitId IS NULL OR p.unitId = :unitId) AND " +
           "(:search IS NULL OR LOWER(CONCAT(p.firstName, ' ', p.lastName)) LIKE :search)")
    Page<Personnel> search(
        @Param("unitId") String unitId,
        @Param("search") String search,
        Pageable pageable
    );
}
