package com.projectmanager.service;

import com.projectmanager.model.PotentialSale;
import com.projectmanager.repository.PotentialSaleRepository;
import com.projectmanager.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PotentialSaleService {
    private final PotentialSaleRepository repo;
    private final ProjectRepository projectRepository;

    public PotentialSaleService(PotentialSaleRepository repo, ProjectRepository projectRepository) {
        this.repo = repo;
        this.projectRepository = projectRepository;
    }

    public List<PotentialSale> getAll() { return repo.findAll(); }
    public List<PotentialSale> getByProject(String projectId) { return repo.findByProjectId(projectId); }
    public Optional<PotentialSale> getById(String id) { return repo.findById(id); }

    @Transactional
    public PotentialSale create(PotentialSale sale) {
        validate(sale);
        return repo.save(sale);
    }

    @Transactional
    public Optional<PotentialSale> update(String id, PotentialSale updated) {
        validate(updated);
        return repo.findById(id).map(existing -> {
            existing.setProjectId(updated.getProjectId());
            existing.setName(updated.getName());
            existing.setAmount(updated.getAmount());
            existing.setCurrency(updated.getCurrency());
            existing.setTargetMonth(updated.getTargetMonth());
            existing.setTargetYear(updated.getTargetYear());
            // Durum değişikliğine göre olasılığı otomatik ayarla
            PotentialSale.Status newStatus = updated.getStatus();
            existing.setStatus(newStatus);
            if (newStatus == PotentialSale.Status.KAZANILDI) {
                existing.setProbability(100.0);
            } else if (newStatus == PotentialSale.Status.KAYBEDILDI) {
                existing.setProbability(0.0);
            } else {
                existing.setProbability(updated.getProbability());
            }
            return repo.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!repo.existsById(id)) return false;
        repo.deleteById(id);
        return true;
    }

    private void validate(PotentialSale s) {
        if (s.getName() == null || s.getName().isBlank())
            throw new IllegalArgumentException("Satış adı zorunludur.");
        if (s.getProjectId() == null || s.getProjectId().isBlank())
            throw new IllegalArgumentException("Proje seçilmelidir.");
        projectRepository.findById(s.getProjectId())
            .orElseThrow(() -> new IllegalArgumentException("Geçersiz proje."));
        if (s.getProbability() < 0 || s.getProbability() > 100)
            throw new IllegalArgumentException("Olasılık 0-100 arasında olmalıdır.");
    }
}
