package com.projectmanager.service;

import com.projectmanager.model.*;
import com.projectmanager.repository.PaymentItemRepository;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.PotentialSaleRepository;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.repository.ResourceEntryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final PersonnelRepository personnelRepository;
    private final ResourceEntryRepository resourceEntryRepository;
    private final PaymentItemRepository paymentItemRepository;
    private final PotentialSaleRepository potentialSaleRepository;
    private final PermissionService permissionService;
    private final ActivityLogService activityLogService;

    public ProjectService(ProjectRepository projectRepository,
                          PersonnelRepository personnelRepository,
                          ResourceEntryRepository resourceEntryRepository,
                          PaymentItemRepository paymentItemRepository,
                          PotentialSaleRepository potentialSaleRepository,
                          PermissionService permissionService,
                          ActivityLogService activityLogService) {
        this.projectRepository    = projectRepository;
        this.personnelRepository   = personnelRepository;
        this.resourceEntryRepository = resourceEntryRepository;
        this.paymentItemRepository = paymentItemRepository;
        this.potentialSaleRepository = potentialSaleRepository;
        this.permissionService     = permissionService;
        this.activityLogService    = activityLogService;
    }

    // ── Listeleme ────────────────────────────────────────────────────────────

    public List<Project> getAll() {
        List<Project> all = projectRepository.findAll();

        if (permissionService.isAdmin()) {
            return all; // ADMIN: tüm projeler, tüm yetkiler
        }

        Map<String, UserProjectPermission> permMap = permissionService.projectPermissionMap();
        boolean fullAccess = (permMap == null); // portfolioFull

        return all.stream()
                .filter(p -> fullAccess || PermissionService.isPotential(p.getProjectStatus())
                        || (permMap.containsKey(p.getId()) && permMap.get(p.getId()).isCanRead()))
                .peek(p -> enrichPermissions(p, fullAccess, permMap))
                .collect(Collectors.toList());
    }

    public Page<Project> getPaged(int page, int size, String categoryId, String status, String excludeStatus) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("name"));
        String catId      = (categoryId == null || categoryId.isBlank()) ? null : categoryId;
        String st         = (status == null || status.isBlank()) ? null : status;
        String excludeSt  = (excludeStatus == null || excludeStatus.isBlank()) ? null : excludeStatus;

        if (permissionService.isAdmin()) {
            return projectRepository.findByFilters(catId, st, excludeSt, pageable);
        }

        Map<String, UserProjectPermission> permMap = permissionService.projectPermissionMap();
        boolean fullAccess = (permMap == null);

        if (fullAccess) {
            return projectRepository.findByFilters(catId, st, excludeSt, pageable);
        }

        // Erişilebilir proje ID'leri (can_read=true olanlar)
        Set<String> allowedIds = permMap.values().stream()
                .filter(UserProjectPermission::isCanRead)
                .map(UserProjectPermission::getProjectId)
                .collect(Collectors.toSet());
        // Boş set JPQL IN sorgusunu bozar → dummy değer ekle
        if (allowedIds.isEmpty()) allowedIds.add("__none__");

        Page<Project> pageResult = projectRepository.findByFiltersAndAccess(catId, st, excludeSt, allowedIds, pageable);
        pageResult.forEach(p -> enrichPermissions(p, false, permMap));
        return pageResult;
    }

    public Optional<Project> getById(String id) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canRead(p.getId(), p.getProjectStatus())) return null;
            if (!permissionService.isAdmin()) {
                Map<String, UserProjectPermission> permMap = permissionService.projectPermissionMap();
                enrichPermissions(p, permMap == null, permMap);
            }
            return p;
        }).filter(java.util.Objects::nonNull);
    }

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @Transactional
    public Project create(Project project) {
        if (!permissionService.canCreateProject())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Proje oluşturma yetkiniz yok.");
        validate(project);
        project.setId(UUID.randomUUID().toString());
        Project saved = projectRepository.save(project);
        try {
            activityLogService.log("PROJE", saved.getId(), saved.getName(), "CREATE",
                    "Bütçe: " + saved.getBudget() + " " + saved.getBudgetCurrency());
        } catch (Exception ignored) {}
        return saved;
    }

    @Transactional
    public Optional<Project> update(String id, Project updated) {
        validate(updated);
        return projectRepository.findById(id).map(existing -> {
            // Potansiyel → gerçek proje dönüşümü: sadece ADMIN
            if (PermissionService.isPotential(existing.getProjectStatus())
                    && !PermissionService.isPotential(updated.getProjectStatus())
                    && !permissionService.canConvertFromPotential()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Potansiyel projeyi gerçek projeye dönüştürme yetkiniz yok.");
            }
            // Genel düzenleme yetkisi
            if (!permissionService.canEdit(id, existing.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projeyi düzenleme yetkiniz yok.");

            // Değişen alanları kaydet (update öncesi)
            java.util.List<String> changes = new java.util.ArrayList<>();
            if (!java.util.Objects.equals(existing.getName(), updated.getName()))
                changes.add("Ad: \"" + existing.getName() + "\" → \"" + updated.getName() + "\"");
            if (!java.util.Objects.equals(existing.getCustomerName(), updated.getCustomerName()))
                changes.add("Müşteri: \"" + existing.getCustomerName() + "\" → \"" + updated.getCustomerName() + "\"");
            if (existing.getBudget() != updated.getBudget())
                changes.add("Bütçe: " + (long)existing.getBudget() + " → " + (long)updated.getBudget() + " " + updated.getBudgetCurrency());
            if (existing.getStartMonth() != updated.getStartMonth() || existing.getStartYear() != updated.getStartYear())
                changes.add("Başlangıç: " + existing.getStartMonth() + "/" + existing.getStartYear() + " → " + updated.getStartMonth() + "/" + updated.getStartYear());
            if (existing.getEndMonth() != updated.getEndMonth() || existing.getEndYear() != updated.getEndYear())
                changes.add("Bitiş: " + existing.getEndMonth() + "/" + existing.getEndYear() + " → " + updated.getEndMonth() + "/" + updated.getEndYear());
            if (existing.getProbability() != updated.getProbability())
                changes.add("Olasılık: %" + (int)existing.getProbability() + " → %" + (int)updated.getProbability());
            String oldStatus = existing.getProjectStatus();

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
            existing.setPnlExcludeRevenue(updated.isPnlExcludeRevenue());
            existing.setPnlExcludeExpense(updated.isPnlExcludeExpense());
            Project saved = projectRepository.save(existing);

            try {
                String newStatus = saved.getProjectStatus();
                if (oldStatus != null && !oldStatus.equals(newStatus)) {
                    activityLogService.log("PROJE", saved.getId(), saved.getName(), "STATUS_CHANGE",
                            oldStatus + " → " + newStatus);
                } else {
                    String detail = changes.isEmpty() ? null : String.join(", ", changes);
                    activityLogService.log("PROJE", saved.getId(), saved.getName(), "UPDATE", detail);
                }
            } catch (Exception ignored) {}

            return saved;
        });
    }

    @Transactional
    public Optional<Project> updateBudget(String id, double potentialSales) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canEdit(id, p.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projeyi düzenleme yetkiniz yok.");
            p.setPotentialSales(potentialSales);
            return projectRepository.save(p);
        });
    }

    @Transactional
    public Optional<Project> updatePersonnel(String id, List<String> personnelIds) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canEdit(id, p.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projeyi düzenleme yetkiniz yok.");
            p.setPersonnelIds(personnelIds);
            return projectRepository.save(p);
        });
    }

    @Transactional
    public Optional<Project> updateProducts(String id, List<String> productIds) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canEdit(id, p.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projeyi düzenleme yetkiniz yok.");
            p.setProductIds(productIds);
            return projectRepository.save(p);
        });
    }

    @Transactional
    public Optional<Project> updatePaymentPlan(String id, List<PaymentItem> paymentPlan) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canWrite(id, p.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projede ödeme kalemi düzenleme yetkiniz yok.");
            // Silinen ödeme kalemlerini bul: sourceOrderId'si olan ama yeni listede olmayan
            List<PaymentItem> existingItems = paymentItemRepository.findByProject_Id(id);
            java.util.Set<String> incomingIds = new java.util.HashSet<>();
            if (paymentPlan != null)
                paymentPlan.forEach(item -> { if (item.getId() != null) incomingIds.add(item.getId()); });
            for (PaymentItem existing : existingItems) {
                if (existing.getSourceOrderId() != null && !incomingIds.contains(existing.getId())) {
                    potentialSaleRepository.findById(existing.getSourceOrderId()).ifPresent(sale -> {
                        sale.setStatus(PotentialSale.Status.AKTIF);
                        sale.setProbability(50.0);
                        potentialSaleRepository.save(sale);
                    });
                }
            }
            p.setPaymentPlan(paymentPlan);
            Project saved = projectRepository.save(p);
            try {
                int count = paymentPlan != null ? paymentPlan.size() : 0;
                activityLogService.log("ODEME_KALEMI", id, saved.getName(), "UPDATE",
                        count + " ödeme kalemi kaydedildi");
            } catch (Exception ignored) {}
            return saved;
        });
    }

    @Transactional
    public Optional<Project> updateMilestones(String id, List<Milestone> milestones) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canWrite(id, p.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projede milestone düzenleme yetkiniz yok.");
            p.setMilestones(milestones);
            return projectRepository.save(p);
        });
    }

    @Transactional
    public Optional<Project> updateResourcePlan(String id, List<ResourceEntry> resourcePlan) {
        return projectRepository.findById(id).map(p -> {
            if (!permissionService.canWrite(id, p.getProjectStatus()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projede kaynak planı düzenleme yetkiniz yok.");
            p.setResourcePlan(resourcePlan);
            return projectRepository.save(p);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!projectRepository.existsById(id)) return false;
        Project p = projectRepository.findById(id).orElse(null);
        if (p != null && !permissionService.canDelete(id, p.getProjectStatus()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projeyi silme yetkiniz yok.");
        String projectName = p != null ? p.getName() : id;
        resourceEntryRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
        try {
            activityLogService.log("PROJE", id, projectName, "DELETE", null);
        } catch (Exception ignored) {}
        return true;
    }

    // ── Yardımcılar ──────────────────────────────────────────────────────────

    /** Projeye mevcut kullanıcının yetki bilgisini ekler */
    private void enrichPermissions(Project p, boolean fullAccess,
                                   Map<String, UserProjectPermission> permMap) {
        if (PermissionService.isPotential(p.getProjectStatus())) {
            p.setMyCanRead(true); p.setMyCanWrite(true);
            p.setMyCanEdit(true); p.setMyCanDelete(true);
            return;
        }
        if (fullAccess) {
            p.setMyCanRead(true); p.setMyCanWrite(true);
            p.setMyCanEdit(true); p.setMyCanDelete(true);
            return;
        }
        UserProjectPermission perm = permMap != null ? permMap.get(p.getId()) : null;
        p.setMyCanRead(perm != null && perm.isCanRead());
        p.setMyCanWrite(perm != null && perm.isCanWrite());
        p.setMyCanEdit(perm != null && perm.isCanEdit());
        p.setMyCanDelete(perm != null && perm.isCanDelete());
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
