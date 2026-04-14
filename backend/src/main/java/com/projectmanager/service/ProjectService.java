package com.projectmanager.service;

import com.projectmanager.model.*;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.repository.ResourceEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final PersonnelRepository personnelRepository;
    private final ResourceEntryRepository resourceEntryRepository;

    public ProjectService(ProjectRepository projectRepository, PersonnelRepository personnelRepository, ResourceEntryRepository resourceEntryRepository) {
        this.projectRepository = projectRepository;
        this.personnelRepository = personnelRepository;
        this.resourceEntryRepository = resourceEntryRepository;
    }

    public List<Project> getAll() { return projectRepository.findAll(); }
    public Optional<Project> getById(String id) { return projectRepository.findById(id); }

    @Transactional
    public Project create(Project project) {
        validate(project);
        project.setId(UUID.randomUUID().toString());
        return projectRepository.save(project);
    }

    @Transactional
    public Optional<Project> update(String id, Project updated) {
        validate(updated);
        return projectRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setCustomerName(updated.getCustomerName());
            existing.setProjectType(updated.getProjectType());
            existing.setCategoryId(updated.getCategoryId());
            existing.setCurrentStepId(updated.getCurrentStepId());
            existing.setStartMonth(updated.getStartMonth());
            existing.setStartYear(updated.getStartYear());
            existing.setEndMonth(updated.getEndMonth());
            existing.setEndYear(updated.getEndYear());
            existing.setBudget(updated.getBudget());
            existing.setBudgetCurrency(updated.getBudgetCurrency());
            existing.setProjectManagerId(updated.getProjectManagerId());
            existing.setTechLeadId(updated.getTechLeadId());
            existing.setUnitId(updated.getUnitId());
            if (updated.getProjectStatus() != null) existing.setProjectStatus(updated.getProjectStatus());
            existing.setProbability(updated.getProbability());
            return projectRepository.save(existing);
        });
    }

    @Transactional
    public Optional<Project> updateBudget(String id, double remainingBudget, double potentialSales) {
        return projectRepository.findById(id).map(p -> {
            p.setRemainingBudget(remainingBudget);
            p.setPotentialSales(potentialSales);
            return projectRepository.save(p);
        });
    }

    @Transactional
    public Optional<Project> updatePersonnel(String id, List<String> personnelIds) {
        return projectRepository.findById(id).map(p -> { p.setPersonnelIds(personnelIds); return projectRepository.save(p); });
    }

    @Transactional
    public Optional<Project> updateProducts(String id, List<String> productIds) {
        return projectRepository.findById(id).map(p -> { p.setProductIds(productIds); return projectRepository.save(p); });
    }

    @Transactional
    public Optional<Project> updatePaymentPlan(String id, List<PaymentItem> paymentPlan) {
        return projectRepository.findById(id).map(p -> { p.setPaymentPlan(paymentPlan); return projectRepository.save(p); });
    }

    @Transactional
    public Optional<Project> updateMilestones(String id, List<Milestone> milestones) {
        return projectRepository.findById(id).map(p -> { p.setMilestones(milestones); return projectRepository.save(p); });
    }

    @Transactional
    public Optional<Project> updateResourcePlan(String id, List<ResourceEntry> resourcePlan) {
        return projectRepository.findById(id).map(p -> { p.setResourcePlan(resourcePlan); return projectRepository.save(p); });
    }

    @Transactional
    public boolean delete(String id) {
        if (!projectRepository.existsById(id)) return false;
        resourceEntryRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
        return true;
    }

    private void validate(Project p) {
        if (p.getName() == null || p.getName().isBlank())
            throw new IllegalArgumentException("Proje adı zorunludur.");
        if (p.getBudgetCurrency() == null || p.getBudgetCurrency().isBlank())
            throw new IllegalArgumentException("Para birimi seçilmelidir.");
        if (p.getProjectManagerId() != null && !p.getProjectManagerId().isBlank())
            personnelRepository.findById(p.getProjectManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz proje yöneticisi."));
        if (p.getTechLeadId() != null && !p.getTechLeadId().isBlank())
            personnelRepository.findById(p.getTechLeadId())
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz teknik lider."));
    }
}
