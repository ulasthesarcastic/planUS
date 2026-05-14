package com.projectmanager.repository;

import com.projectmanager.model.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<ActivityLog> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);
    Page<ActivityLog> findByEntityTypeInOrderByCreatedAtDesc(List<String> entityTypes, Pageable pageable);
}
