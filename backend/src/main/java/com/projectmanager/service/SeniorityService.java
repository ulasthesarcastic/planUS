package com.projectmanager.service;

import com.projectmanager.model.Seniority;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.SeniorityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SeniorityService {
    private final SeniorityRepository seniorityRepository;
    private final PersonnelRepository personnelRepository;
    private final ActivityLogService activityLogService;

    public SeniorityService(SeniorityRepository seniorityRepository,
                            PersonnelRepository personnelRepository,
                            ActivityLogService activityLogService) {
        this.seniorityRepository = seniorityRepository;
        this.personnelRepository = personnelRepository;
        this.activityLogService = activityLogService;
    }

    public List<Seniority> getAll() { return seniorityRepository.findAll(); }
    public Optional<Seniority> getById(String id) { return seniorityRepository.findById(id); }

    @Transactional
    public Seniority create(Seniority seniority) {
        Seniority saved = seniorityRepository.save(seniority);
        try {
            activityLogService.log("KIDEM", saved.getId(), saved.getName(), "CREATE", null);
        } catch (Exception ignored) {}
        return saved;
    }

    @Transactional
    public Optional<Seniority> update(String id, Seniority updated) {
        return seniorityRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setRates(updated.getRates());
            Seniority saved = seniorityRepository.save(existing);
            try {
                activityLogService.log("KIDEM", saved.getId(), saved.getName(), "UPDATE", null);
            } catch (Exception ignored) {}
            return saved;
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (personnelRepository.existsBySeniorityId(id))
            throw new IllegalStateException("Bu kıdeme bağlı personel bulunmaktadır.");
        if (!seniorityRepository.existsById(id)) return false;
        String name = seniorityRepository.findById(id).map(Seniority::getName).orElse(id);
        seniorityRepository.deleteById(id);
        try {
            activityLogService.log("KIDEM", id, name, "DELETE", null);
        } catch (Exception ignored) {}
        return true;
    }
}
