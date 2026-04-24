package com.projectmanager.repository;

import com.projectmanager.model.ProjectCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectCostRepository extends JpaRepository<ProjectCost, String> {
    List<ProjectCost> findByProjectId(String projectId);

    @Modifying
    @Query("DELETE FROM ProjectCost c WHERE c.projectId = :projectId")
    void deleteByProjectId(@Param("projectId") String projectId);
}
