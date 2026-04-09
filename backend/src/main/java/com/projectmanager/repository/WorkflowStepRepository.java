package com.projectmanager.repository;

import com.projectmanager.model.WorkflowStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface WorkflowStepRepository extends JpaRepository<WorkflowStep, String> {
    List<WorkflowStep> findByCategoryIdOrderByStepOrderAsc(String categoryId);

    @Modifying
    @Transactional
    void deleteByCategoryId(String categoryId);
}
