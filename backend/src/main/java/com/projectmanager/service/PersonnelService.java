package com.projectmanager.service;

import com.projectmanager.model.Personnel;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.SeniorityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PersonnelService {
    private final PersonnelRepository personnelRepository;
    private final SeniorityRepository seniorityRepository;

    public PersonnelService(PersonnelRepository personnelRepository, SeniorityRepository seniorityRepository) {
        this.personnelRepository = personnelRepository;
        this.seniorityRepository = seniorityRepository;
    }

    public List<Personnel> getAll() { return personnelRepository.findAll(); }
    public Optional<Personnel> getById(String id) { return personnelRepository.findById(id); }

    @Transactional
    public Personnel create(Personnel personnel) {
        validateSeniority(personnel.getSeniorityId());
        personnel.setId(UUID.randomUUID().toString());
        return personnelRepository.save(personnel);
    }

    @Transactional
    public Optional<Personnel> update(String id, Personnel updated) {
        validateSeniority(updated.getSeniorityId());
        return personnelRepository.findById(id).map(existing -> {
            existing.setFirstName(updated.getFirstName());
            existing.setLastName(updated.getLastName());
            existing.setSeniorityId(updated.getSeniorityId());
            return personnelRepository.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!personnelRepository.existsById(id)) return false;
        personnelRepository.deleteById(id);
        return true;
    }

    private void validateSeniority(String seniorityId) {
        if (seniorityId == null || seniorityId.isBlank())
            throw new IllegalArgumentException("Kıdem seçilmelidir.");
        seniorityRepository.findById(seniorityId)
            .orElseThrow(() -> new IllegalArgumentException("Geçersiz kıdem ID: " + seniorityId));
    }
}
