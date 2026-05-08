package com.projectmanager.service;

import com.projectmanager.model.PaymentItem;
import com.projectmanager.model.PotentialSale;
import com.projectmanager.repository.PaymentItemRepository;
import com.projectmanager.repository.PotentialSaleRepository;
import com.projectmanager.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PotentialSaleService {

    private final PotentialSaleRepository repo;
    private final ProjectRepository projectRepository;
    private final PaymentItemRepository paymentItemRepository;
    private final PermissionService permissionService;

    public PotentialSaleService(PotentialSaleRepository repo,
                                ProjectRepository projectRepository,
                                PaymentItemRepository paymentItemRepository,
                                PermissionService permissionService) {
        this.repo = repo;
        this.projectRepository = projectRepository;
        this.paymentItemRepository = paymentItemRepository;
        this.permissionService = permissionService;
    }

    public List<PotentialSale> getAll() {
        return repo.findAll().stream()
                .filter(s -> permissionService.canReadSale(s.getProjectId()))
                .collect(Collectors.toList());
    }

    public List<PotentialSale> getByProject(String projectId) {
        if (!permissionService.canReadSale(projectId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu projenin satışlarını görme yetkiniz yok.");
        return repo.findByProjectId(projectId);
    }
    public Optional<PotentialSale> getById(String id) { return repo.findById(id); }

    @Transactional
    public PotentialSale create(PotentialSale sale) {
        if (!permissionService.canWriteSale(sale.getProjectId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Satış/sipariş oluşturma yetkiniz yok.");
        validate(sale);
        PotentialSale saved = repo.save(sale);

        // Direkt KAZANILDI olarak kaydedildiyse PaymentItem oluştur
        if (saved.getStatus() == PotentialSale.Status.KAZANILDI
                && saved.getProjectId() != null && !saved.getProjectId().isBlank()) {
            projectRepository.findById(saved.getProjectId()).ifPresent(project -> {
                PaymentItem item = new PaymentItem();
                item.setProject(project);
                item.setName(saved.getName());
                item.setAmount(saved.getAmount());
                item.setCurrency(saved.getCurrency() != null ? saved.getCurrency() : "TRY");
                item.setPlannedMonth(saved.getTargetMonth() > 0 ? saved.getTargetMonth() : null);
                item.setPlannedYear(saved.getTargetYear() > 0 ? saved.getTargetYear() : null);
                item.setCompleted(false);
                item.setSourceOrderId(saved.getId());
                paymentItemRepository.save(item);
            });
        }

        return saved;
    }

    @Transactional
    public Optional<PotentialSale> update(String id, PotentialSale updated) {
        validate(updated);

        PotentialSale existing = repo.findById(id).orElse(null);
        if (existing == null) return Optional.empty();
        if (!permissionService.canEditSale(existing.getProjectId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu satışı/siparişi düzenleme yetkiniz yok.");

        PotentialSale.Status oldStatus = existing.getStatus();
        PotentialSale.Status newStatus = updated.getStatus();

        // KAZANILDI'dan çıkıyorsak ve ödeme alındıysa → işlemi blokla
        if (oldStatus == PotentialSale.Status.KAZANILDI && newStatus != PotentialSale.Status.KAZANILDI) {
            paymentItemRepository.findFirstBySourceOrderId(id).ifPresent(item -> {
                if (item.isCompleted()) {
                    throw new IllegalArgumentException(
                        "Bu siparişe ait ödeme alındı olarak işaretlenmiş. Potansiyele çevirebilmek için önce ödeme kalemini silin.");
                }
            });
        }

        // Alanları güncelle
        existing.setProjectId(updated.getProjectId());
        existing.setCategoryId(updated.getCategoryId());
        existing.setName(updated.getName());
        existing.setAmount(updated.getAmount());
        existing.setCurrency(updated.getCurrency());
        existing.setTargetMonth(updated.getTargetMonth());
        existing.setTargetYear(updated.getTargetYear());
        if (updated.getSaleType() != null) existing.setSaleType(updated.getSaleType());

        existing.setStatus(newStatus);
        if (newStatus == PotentialSale.Status.KAZANILDI) {
            existing.setProbability(100.0);
        } else if (newStatus == PotentialSale.Status.KAYBEDILDI) {
            existing.setProbability(0.0);
        } else {
            existing.setProbability(updated.getProbability());
        }

        PotentialSale saved = repo.save(existing);

        // KAZANILDI durumunda PaymentItem oluştur ya da güncelle
        if (newStatus == PotentialSale.Status.KAZANILDI) {
            if (saved.getProjectId() != null && !saved.getProjectId().isBlank()) {
                Optional<PaymentItem> existingItem = paymentItemRepository.findFirstBySourceOrderId(saved.getId());
                projectRepository.findById(saved.getProjectId()).ifPresent(project -> {
                    PaymentItem item = existingItem.orElseGet(PaymentItem::new);
                    item.setProject(project);
                    item.setName(saved.getName());
                    item.setAmount(saved.getAmount());
                    item.setCurrency(saved.getCurrency() != null ? saved.getCurrency() : "TRY");
                    item.setPlannedMonth(saved.getTargetMonth() > 0 ? saved.getTargetMonth() : null);
                    item.setPlannedYear(saved.getTargetYear() > 0 ? saved.getTargetYear() : null);
                    item.setSourceOrderId(saved.getId());
                    if (existingItem.isEmpty()) item.setCompleted(false);
                    paymentItemRepository.save(item);
                });
            }
        }

        // KAZANILDI → başka statü: PaymentItem sil (tamamlanmamış — tamamlanmışsa zaten yukarıda bloklandı)
        if (oldStatus == PotentialSale.Status.KAZANILDI && newStatus != PotentialSale.Status.KAZANILDI) {
            paymentItemRepository.findFirstBySourceOrderId(id).ifPresent(paymentItemRepository::delete);
        }

        return Optional.of(saved);
    }

    @Transactional
    public boolean delete(String id) {
        PotentialSale sale = repo.findById(id).orElse(null);
        if (sale == null) return false;
        if (!permissionService.canDeleteSale(sale.getProjectId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu satışı/siparişi silme yetkiniz yok.");

        // KAZANILDI durumundaki siparişi silmek: ödeme alındıysa blokla, değilse PaymentItem'ı da sil
        if (sale.getStatus() == PotentialSale.Status.KAZANILDI) {
            paymentItemRepository.findFirstBySourceOrderId(id).ifPresent(item -> {
                if (item.isCompleted()) {
                    throw new IllegalArgumentException(
                        "Bu siparişe ait ödeme alındı olarak işaretlenmiş. Silebilmek için önce ödeme kalemini silin.");
                }
                paymentItemRepository.delete(item);
            });
        }

        repo.deleteById(id);
        return true;
    }

    /** Mevcut KAZANILDI siparişlerinde eksik PaymentItem'ları oluşturur, duplikaları temizler. */
    @Transactional
    public int repairPaymentItems() {
        int count = 0;
        for (PotentialSale sale : repo.findAll()) {
            if (sale.getStatus() != PotentialSale.Status.KAZANILDI) continue;
            if (sale.getProjectId() == null || sale.getProjectId().isBlank()) continue;

            // Duplicate temizliği: aynı sourceOrderId'ye birden fazla kayıt varsa ilki dışındakileri sil
            var allItems = paymentItemRepository.findAllBySourceOrderId(sale.getId());
            if (allItems.size() > 1) {
                paymentItemRepository.deleteAll(allItems.subList(1, allItems.size()));
            }
            if (!allItems.isEmpty()) continue; // zaten var, atla
            var project = projectRepository.findById(sale.getProjectId()).orElse(null);
            if (project == null) continue;
            PaymentItem item = new PaymentItem();
            item.setProject(project);
            item.setName(sale.getName());
            item.setAmount(sale.getAmount());
            item.setCurrency(sale.getCurrency() != null ? sale.getCurrency() : "TRY");
            item.setPlannedMonth(sale.getTargetMonth() > 0 ? sale.getTargetMonth() : null);
            item.setPlannedYear(sale.getTargetYear() > 0 ? sale.getTargetYear() : null);
            item.setCompleted(false);
            item.setSourceOrderId(sale.getId());
            paymentItemRepository.save(item);
            count++;
        }
        return count;
    }

    private void validate(PotentialSale s) {
        if (s.getName() == null || s.getName().isBlank())
            throw new IllegalArgumentException("Satış adı zorunludur.");
        // projectId opsiyonel — sadece girilmişse doğrula
        if (s.getProjectId() != null && !s.getProjectId().isBlank()) {
            var project = projectRepository.findById(s.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz proje."));
            if ("POTANSIYEL".equals(project.getProjectStatus()))
                throw new IllegalArgumentException("Potansiyel projeler sipariş/satış ile ilişkilendirilemez.");
        }
        if (s.getProbability() < 0 || s.getProbability() > 100)
            throw new IllegalArgumentException("Olasılık 0-100 arasında olmalıdır.");
    }
}
