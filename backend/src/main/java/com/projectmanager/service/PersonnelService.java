package com.projectmanager.service;

import com.projectmanager.model.Personnel;
import com.projectmanager.model.PersonnelSeniorityHistory;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.PersonnelSeniorityHistoryRepository;
import com.projectmanager.repository.ResourceEntryRepository;
import com.projectmanager.repository.SeniorityRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PersonnelService {
    private final PersonnelRepository personnelRepository;
    private final SeniorityRepository seniorityRepository;
    private final ResourceEntryRepository resourceEntryRepository;
    private final PersonnelSeniorityHistoryRepository seniorityHistoryRepository;
    private final ActivityLogService activityLogService;

    public PersonnelService(PersonnelRepository personnelRepository,
                            SeniorityRepository seniorityRepository,
                            ResourceEntryRepository resourceEntryRepository,
                            PersonnelSeniorityHistoryRepository seniorityHistoryRepository,
                            ActivityLogService activityLogService) {
        this.personnelRepository = personnelRepository;
        this.seniorityRepository = seniorityRepository;
        this.resourceEntryRepository = resourceEntryRepository;
        this.seniorityHistoryRepository = seniorityHistoryRepository;
        this.activityLogService = activityLogService;
    }

    public List<Personnel> getAll() { return personnelRepository.findAll(); }
    public Optional<Personnel> getById(String id) { return personnelRepository.findById(id); }

    public Page<Personnel> search(String q, String unitId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        // Wildcard ve küçük harf dönüşümünü Java'da yap → PostgreSQL bytea sorunu önlenir
        String search = (q == null || q.isBlank()) ? null : "%" + q.trim().toLowerCase() + "%";
        String unit   = (unitId == null || unitId.isBlank()) ? null : unitId.trim();
        return personnelRepository.search(unit, search, pageable);
    }

    @Transactional
    public Personnel create(Personnel personnel) {
        validateSeniority(personnel.getSeniorityId());
        personnel.setId(UUID.randomUUID().toString());
        Personnel saved = personnelRepository.save(personnel);
        try {
            activityLogService.log("PERSONEL", saved.getId(),
                    saved.getFirstName() + " " + saved.getLastName(), "CREATE", null);
        } catch (Exception ignored) {}
        return saved;
    }

    @Transactional
    public Optional<Personnel> update(String id, Personnel updated) {
        validateSeniority(updated.getSeniorityId());
        return personnelRepository.findById(id).map(existing -> {
            existing.setFirstName(updated.getFirstName());
            existing.setLastName(updated.getLastName());
            existing.setSeniorityId(updated.getSeniorityId());
            existing.setUnitId(updated.getUnitId());
            if (updated.getStartDate() != null) existing.setStartDate(updated.getStartDate());
            existing.setEndDate(updated.getEndDate());
            Personnel saved = personnelRepository.save(existing);
            try {
                activityLogService.log("PERSONEL", saved.getId(),
                        saved.getFirstName() + " " + saved.getLastName(), "UPDATE", null);
            } catch (Exception ignored) {}
            return saved;
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!personnelRepository.existsById(id)) return false;
        String name = personnelRepository.findById(id)
                .map(p -> p.getFirstName() + " " + p.getLastName()).orElse(id);
        personnelRepository.deleteById(id);
        try {
            activityLogService.log("PERSONEL", id, name, "DELETE", null);
        } catch (Exception ignored) {}
        return true;
    }

    // ── Kıdem geçmişi ──────────────────────────────────────────────────────────

    public List<PersonnelSeniorityHistory> getSeniorityHistory(String personnelId) {
        return seniorityHistoryRepository.findByPersonnelIdOrderByStartDateAsc(personnelId);
    }

    public List<PersonnelSeniorityHistory> getAllSeniorityHistory() {
        return seniorityHistoryRepository.findAllByOrderByPersonnelIdAscStartDateAsc();
    }

    @Transactional
    public List<PersonnelSeniorityHistory> saveSeniorityHistory(String personnelId, List<PersonnelSeniorityHistory> entries) {
        seniorityHistoryRepository.deleteByPersonnelId(personnelId);
        for (PersonnelSeniorityHistory e : entries) {
            e.setId(null);
            e.setPersonnelId(personnelId);
        }
        List<PersonnelSeniorityHistory> saved = seniorityHistoryRepository.saveAll(entries);
        // Personnel.seniorityId'yi en güncel açık uçlu (veya son) kaydın seniorityId'si ile güncelle
        entries.stream()
            .filter(e -> e.getEndDate() == null)
            .reduce((a, b) -> b) // en son açık uçlu kayıt
            .or(() -> entries.stream().reduce((a, b) -> b)) // yoksa en son kayıt
            .ifPresent(latest -> personnelRepository.findById(personnelId).ifPresent(p -> {
                p.setSeniorityId(latest.getSeniorityId());
                personnelRepository.save(p);
            }));
        return saved;
    }

    // ── Future plan silme ───────────────────────────────────────────────────────

    public long countFuturePlans(String personnelId, int year, int month) {
        return resourceEntryRepository.countFutureEntries(personnelId, year, month);
    }

    public Map<String, Object> getFuturePlanDetails(String personnelId, int year, int month) {
        var entries = resourceEntryRepository.findFutureEntries(personnelId, year, month);
        // Proje bazında grupla (sıra korumak için LinkedHashMap)
        Map<String, String> projectNames = new LinkedHashMap<>();
        for (var e : entries) {
            var p = e.getProject();
            if (p != null) projectNames.put(p.getId(), p.getName());
        }
        List<Map<String, String>> projects = new ArrayList<>();
        for (var entry : projectNames.entrySet()) {
            projects.add(Map.of("id", entry.getKey(), "name", entry.getValue()));
        }
        return Map.of("count", (long) entries.size(), "projects", projects);
    }

    @Transactional
    public int deleteFuturePlans(String personnelId, int year, int month) {
        return resourceEntryRepository.deleteFutureEntries(personnelId, year, month);
    }

    private void validateSeniority(String seniorityId) {
        if (seniorityId == null || seniorityId.isBlank())
            throw new IllegalArgumentException("Kıdem seçilmelidir.");
        seniorityRepository.findById(seniorityId)
            .orElseThrow(() -> new IllegalArgumentException("Geçersiz kıdem ID: " + seniorityId));
    }
}
