package com.projectmanager.repository;

import com.projectmanager.model.Procurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProcurementRepository extends JpaRepository<Procurement, Long> {

    List<Procurement> findByProjectIdOrderByIdAsc(String projectId);

    @Modifying
    @Query("DELETE FROM Procurement p WHERE p.projectId = :projectId")
    void deleteByProjectId(@Param("projectId") String projectId);
}
