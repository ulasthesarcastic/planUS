package com.projectmanager.repository;

import com.projectmanager.model.PotentialSale;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PotentialSaleRepository extends JpaRepository<PotentialSale, String> {
    List<PotentialSale> findByProjectId(String projectId);
    List<PotentialSale> findByStatus(PotentialSale.Status status);
}
