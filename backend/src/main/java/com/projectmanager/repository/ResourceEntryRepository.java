package com.projectmanager.repository;

import com.projectmanager.model.ResourceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ResourceEntryRepository extends JpaRepository<ResourceEntry, Long> {
    @Query("SELECT r FROM ResourceEntry r WHERE r.project.id = :projectId")
    List<ResourceEntry> findByProjectId(@Param("projectId") String projectId);

    @Modifying
    @Query("DELETE FROM ResourceEntry r WHERE r.project.id = :projectId")
    void deleteByProjectId(String projectId);

    @Query("SELECT COUNT(r) FROM ResourceEntry r WHERE r.personnelId = :personnelId AND (r.year > :year OR (r.year = :year AND r.month > :month))")
    long countFutureEntries(@Param("personnelId") String personnelId, @Param("year") int year, @Param("month") int month);

    @Query("SELECT r FROM ResourceEntry r WHERE r.personnelId = :personnelId AND (r.year > :year OR (r.year = :year AND r.month > :month))")
    List<ResourceEntry> findFutureEntries(@Param("personnelId") String personnelId, @Param("year") int year, @Param("month") int month);

    @Modifying
    @Query("DELETE FROM ResourceEntry r WHERE r.personnelId = :personnelId AND (r.year > :year OR (r.year = :year AND r.month > :month))")
    int deleteFutureEntries(@Param("personnelId") String personnelId, @Param("year") int year, @Param("month") int month);
}
