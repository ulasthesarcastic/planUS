package com.projectmanager.repository;

import com.projectmanager.model.ProjectType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectTypeRepository extends JpaRepository<ProjectType, String> {
    List<ProjectType> findAllByOrderBySortOrderAsc();
    boolean existsByName(String name);
}
