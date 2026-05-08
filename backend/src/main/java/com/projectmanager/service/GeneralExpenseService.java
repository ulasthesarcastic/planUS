package com.projectmanager.service;

import com.projectmanager.model.GeneralExpense;
import com.projectmanager.repository.GeneralExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class GeneralExpenseService {

    private final GeneralExpenseRepository repo;

    public GeneralExpenseService(GeneralExpenseRepository repo) {
        this.repo = repo;
    }

    public List<GeneralExpense> getAll() {
        return repo.findAll();
    }

    @Transactional
    public GeneralExpense create(GeneralExpense expense) {
        validate(expense);
        return repo.save(expense);
    }

    @Transactional
    public Optional<GeneralExpense> update(String id, GeneralExpense expense) {
        return repo.findById(id).map(existing -> {
            validate(expense);
            existing.setName(expense.getName());
            existing.setAmount(expense.getAmount());
            existing.setStartMonth(expense.getStartMonth());
            existing.setStartYear(expense.getStartYear());
            existing.setEndMonth(expense.getEndMonth());
            existing.setEndYear(expense.getEndYear());
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    private void validate(GeneralExpense e) {
        if (e.getName() == null || e.getName().isBlank())
            throw new IllegalArgumentException("Gider adı zorunludur.");
        if (e.getAmount() < 0)
            throw new IllegalArgumentException("Tutar negatif olamaz.");
        int startTotal = e.getStartYear() * 12 + e.getStartMonth();
        int endTotal   = e.getEndYear()   * 12 + e.getEndMonth();
        if (startTotal > endTotal)
            throw new IllegalArgumentException("Başlangıç tarihi bitiş tarihinden sonra olamaz.");
    }
}
