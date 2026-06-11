package com.projectmanager.repository;

import com.projectmanager.model.PaymentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentItemRepository extends JpaRepository<PaymentItem, String> {
    List<PaymentItem> findByProject_Id(String projectId);
    Optional<PaymentItem> findFirstBySourceOrderId(String sourceOrderId);
    List<PaymentItem> findAllBySourceOrderId(String sourceOrderId);

    // Hibernate first-level cache'ini bypass ederek doğrudan SQL DELETE — CascadeType.ALL/orphanRemoval çakışmasını önler
    @Modifying
    @Query("DELETE FROM PaymentItem p WHERE p.sourceOrderId = :sourceOrderId")
    void deleteAllBySourceOrderId(@Param("sourceOrderId") String sourceOrderId);
}
