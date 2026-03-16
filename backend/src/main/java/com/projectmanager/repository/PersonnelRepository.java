package com.projectmanager.repository;

import com.projectmanager.model.Personnel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonnelRepository extends JpaRepository<Personnel, String> {
    boolean existsBySeniorityId(String seniorityId);
}
