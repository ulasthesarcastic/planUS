package com.projectmanager.repository;

import com.projectmanager.model.PaymentItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentItemRepository extends JpaRepository<PaymentItem, String> {
    List<PaymentItem> findByProject_Id(String projectId);
    Optional<PaymentItem> findFirstBySourceOrderId(String sourceOrderId);
    List<PaymentItem> findAllBySourceOrderId(String sourceOrderId);
}
