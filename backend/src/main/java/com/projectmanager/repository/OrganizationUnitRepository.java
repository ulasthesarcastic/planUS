package com.projectmanager.repository;

import com.projectmanager.model.OrganizationUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrganizationUnitRepository extends JpaRepository<OrganizationUnit, String> {
    List<OrganizationUnit> findByParentIdIsNull();
    List<OrganizationUnit> findByParentId(String parentId);
    boolean existsByParentId(String parentId);
}
