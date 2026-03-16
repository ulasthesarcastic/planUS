package com.projectmanager.repository;

import com.projectmanager.model.ResourceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ResourceEntryRepository extends JpaRepository<ResourceEntry, Long> {
    @Modifying
    @Query("DELETE FROM ResourceEntry r WHERE r.project.id = :projectId")
    void deleteByProjectId(String projectId);
}
