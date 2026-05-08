package com.projectmanager.repository;

import com.projectmanager.model.PersonnelSeniorityHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonnelSeniorityHistoryRepository extends JpaRepository<PersonnelSeniorityHistory, Long> {
    List<PersonnelSeniorityHistory> findByPersonnelIdOrderByStartDateAsc(String personnelId);
    List<PersonnelSeniorityHistory> findAllByOrderByPersonnelIdAscStartDateAsc();
    void deleteByPersonnelId(String personnelId);
}
