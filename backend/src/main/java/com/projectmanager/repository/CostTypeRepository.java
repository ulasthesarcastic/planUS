package com.projectmanager.repository;

import com.projectmanager.model.CostType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CostTypeRepository extends JpaRepository<CostType, String> {
    List<CostType> findAllByOrderByNameAsc();
}
