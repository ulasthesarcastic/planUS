package com.projectmanager.service;

import com.projectmanager.model.Seniority;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.SeniorityRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SeniorityService {

    private final SeniorityRepository seniorityRepository;
    private final PersonnelRepository personnelRepository;

    public SeniorityService(SeniorityRepository seniorityRepository,
                            PersonnelRepository personnelRepository) {
        this.seniorityRepository = seniorityRepository;
        this.personnelRepository = personnelRepository;
    }

    public List<Seniority> getAll() {
        return seniorityRepository.findAll();
    }

    public Optional<Seniority> getById(String id) {
        return seniorityRepository.findById(id);
    }

    public Seniority create(Seniority seniority) {
        return seniorityRepository.save(seniority);
    }

    public Optional<Seniority> update(String id, Seniority updated) {
        return seniorityRepository.findById(id).map(existing -> {
            existing.setName(updated.getName());
            existing.setRates(updated.getRates());
            return seniorityRepository.save(existing);
        });
    }

    public boolean delete(String id) {
        if (personnelRepository.existsBySeniorityId(id)) {
            throw new IllegalStateException("Bu kıdeme bağlı personel bulunmaktadır. Önce personeli silin veya kıdemini değiştirin.");
        }
        return seniorityRepository.deleteById(id);
    }
}
