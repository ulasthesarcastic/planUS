package com.projectmanager.service;

import com.projectmanager.model.WorkflowStep;
import com.projectmanager.repository.WorkflowStepRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class WorkflowStepService {

    private final WorkflowStepRepository repo;

    public WorkflowStepService(WorkflowStepRepository repo) {
        this.repo = repo;
    }

    public List<WorkflowStep> getByCategoryId(String categoryId) {
        return repo.findByCategoryIdOrderByStepOrderAsc(categoryId);
    }

    @Transactional
    public WorkflowStep create(WorkflowStep step) {
        if (step.getLabel() == null || step.getLabel().isBlank())
            throw new IllegalArgumentException("Adım etiketi zorunludur.");
        return repo.save(step);
    }

    @Transactional
    public Optional<WorkflowStep> update(String id, WorkflowStep step) {
        return repo.findById(id).map(existing -> {
            existing.setCategoryId(step.getCategoryId());
            existing.setLabel(step.getLabel());
            existing.setStepType(step.getStepType());
            existing.setPositionX(step.getPositionX());
            existing.setPositionY(step.getPositionY());
            existing.setStepOrder(step.getStepOrder());
            existing.setTransitions(step.getTransitions());
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    @Transactional
    public List<WorkflowStep> saveAll(String categoryId, List<WorkflowStep> steps) {
        repo.deleteByCategoryId(categoryId);
        steps.forEach(step -> step.setCategoryId(categoryId));
        return repo.saveAll(steps);
    }
}
