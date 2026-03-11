package com.projectmanager.service;

import com.projectmanager.model.Milestone;
import com.projectmanager.model.ResourceEntry;
import com.projectmanager.model.PaymentItem;
import com.projectmanager.model.Project;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final PersonnelRepository personnelRepository;

    public ProjectService(ProjectRepository projectRepository,
                          PersonnelRepository personnelRepository) {
        this.projectRepository = projectRepository;
        this.personnelRepository = personnelRepository;
    }

    public List<Project> getAll() { return projectRepository.findAll(); }

    public Optional<Project> getById(String id) { return projectRepository.findById(id); }

    public Project create(Project project) {
        validate(project);
        project.setId(UUID.randomUUID().toString());
        return projectRepository.save(project);
    }

    public Optional<Project> update(String id, Project updated) {
        validate(updated);
        return projectRepository.findById(id).map(existing -> {
            // Sadece temel alanlar — alt listeler kendi endpoint'lerinden yönetilir
            existing.setName(updated.getName());
            existing.setCustomerName(updated.getCustomerName());
            existing.setStartMonth(updated.getStartMonth());
            existing.setStartYear(updated.getStartYear());
            existing.setEndMonth(updated.getEndMonth());
            existing.setEndYear(updated.getEndYear());
            existing.setBudget(updated.getBudget());
            existing.setBudgetCurrency(updated.getBudgetCurrency());
            existing.setProjectManagerId(updated.getProjectManagerId());
            existing.setTechLeadId(updated.getTechLeadId());
            return projectRepository.save(existing);
        });
    }

    // Partial updates — sadece ilgili listeyi günceller
    public Optional<Project> updatePersonnel(String id, List<String> personnelIds) {
        return projectRepository.findById(id).map(existing -> {
            existing.setPersonnelIds(personnelIds);
            return projectRepository.save(existing);
        });
    }

    public Optional<Project> updatePaymentPlan(String id, List<PaymentItem> paymentPlan) {
        return projectRepository.findById(id).map(existing -> {
            existing.setPaymentPlan(paymentPlan);
            return projectRepository.save(existing);
        });
    }

    public Optional<Project> updateMilestones(String id, List<Milestone> milestones) {
        return projectRepository.findById(id).map(existing -> {
            existing.setMilestones(milestones);
            return projectRepository.save(existing);
        });
    }

    public Optional<Project> updateResourcePlan(String id, List<ResourceEntry> resourcePlan) {
        return projectRepository.findById(id).map(existing -> {
            existing.setResourcePlan(resourcePlan);
            return projectRepository.save(existing);
        });
    }

    public boolean delete(String id) { return projectRepository.deleteById(id); }

    private void validate(Project p) {
        if (p.getName() == null || p.getName().isBlank())
            throw new IllegalArgumentException("Proje adi zorunludur.");
        if (p.getBudgetCurrency() == null || p.getBudgetCurrency().isBlank())
            throw new IllegalArgumentException("Para birimi secilmelidir.");
        if (p.getProjectManagerId() != null && !p.getProjectManagerId().isBlank()) {
            personnelRepository.findById(p.getProjectManagerId())
                .orElseThrow(() -> new IllegalArgumentException("Gecersiz proje yoneticisi."));
        }
        if (p.getTechLeadId() != null && !p.getTechLeadId().isBlank()) {
            personnelRepository.findById(p.getTechLeadId())
                .orElseThrow(() -> new IllegalArgumentException("Gecersiz teknik lider."));
        }
    }
}
