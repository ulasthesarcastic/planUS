package com.projectmanager.repository;

import com.projectmanager.model.GeneralExpense;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GeneralExpenseRepository extends JpaRepository<GeneralExpense, String> {
}
