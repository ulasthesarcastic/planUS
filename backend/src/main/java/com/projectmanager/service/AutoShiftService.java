package com.projectmanager.service;

import com.projectmanager.model.*;
import com.projectmanager.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AutoShiftService {

    private final ProjectRepository         projectRepo;
    private final ResourceEntryRepository   resourceEntryRepo;
    private final PaymentItemRepository     paymentItemRepo;
    private final PotentialSaleRepository   potentialSaleRepo;
    private final ActivityLogRepository     activityLogRepo;

    public AutoShiftService(ProjectRepository projectRepo,
                            ResourceEntryRepository resourceEntryRepo,
                            PaymentItemRepository paymentItemRepo,
                            PotentialSaleRepository potentialSaleRepo,
                            ActivityLogRepository activityLogRepo) {
        this.projectRepo       = projectRepo;
        this.resourceEntryRepo = resourceEntryRepo;
        this.paymentItemRepo   = paymentItemRepo;
        this.potentialSaleRepo = potentialSaleRepo;
        this.activityLogRepo   = activityLogRepo;
    }

    public record ShiftResult(List<ShiftedItem> shiftedProjects, List<ShiftedItem> shiftedSales) {}
    public record ShiftedItem(String id, String name, String from, String to) {}

    /**
     * Geçmiş ayda kalan POTANSIYEL projeleri ve AKTIF potansiyel siparişleri
     * bir sonraki aya (bugün + 1 ay) kaydırır. Her kaydırma activity_log'a yazılır.
     */
    @Transactional
    public ShiftResult shiftOverdue() {
        LocalDate today     = LocalDate.now();
        int curYear         = today.getYear();
        int curMonth        = today.getMonthValue();

        // Hedef ay: bir sonraki ay
        int nextAbsolute    = curYear * 12 + curMonth + 1;
        int targetYear      = (nextAbsolute - 1) / 12;
        int targetMonth     = (nextAbsolute - 1) % 12 + 1;

        List<ShiftedItem> shiftedProjects = shiftProjects(curYear, curMonth, targetYear, targetMonth, nextAbsolute);
        List<ShiftedItem> shiftedSales    = shiftSales(curYear, curMonth, targetYear, targetMonth);

        return new ShiftResult(shiftedProjects, shiftedSales);
    }

    // ── Potansiyel Projeler ────────────────────────────────────────────────────

    private List<ShiftedItem> shiftProjects(int curYear, int curMonth,
                                             int targetYear, int targetMonth,
                                             int nextAbsolute) {
        List<ShiftedItem> results = new ArrayList<>();
        List<Project> potentials  = projectRepo.findByProjectStatus("POTANSIYEL");

        for (Project p : potentials) {
            int startAbsolute = p.getStartYear() * 12 + p.getStartMonth();
            // Sadece geçmişte kalan (bugünkü aydan önce) projeler kaydırılır
            if (startAbsolute >= curYear * 12 + curMonth) continue;

            int delta = nextAbsolute - startAbsolute;

            String from = p.getStartMonth() + "/" + p.getStartYear();

            // Proje başlangıç ve bitiş tarihlerini kaydır
            int newStart = startAbsolute + delta;
            int newEnd   = p.getEndYear() * 12 + p.getEndMonth() + delta;

            p.setStartMonth((newStart - 1) % 12 + 1);
            p.setStartYear((newStart - 1) / 12);
            p.setEndMonth((newEnd - 1) % 12 + 1);
            p.setEndYear((newEnd - 1) / 12);
            projectRepo.save(p);

            // Resource entry'leri kaydır
            shiftResourceEntries(p, delta);

            // Tamamlanmamış ödeme kalemlerini kaydır
            shiftPaymentItems(p.getId(), delta);

            String to = targetMonth + "/" + targetYear;
            results.add(new ShiftedItem(p.getId(), p.getName(), from, to));

            activityLogRepo.save(new ActivityLog(
                "POTANSIYEL_PROJE", p.getId(), p.getName(),
                "AUTO_SHIFT", "system",
                "Başlangıç tarihi " + from + " → " + to + " (" + delta + " ay ileri)"
            ));
        }
        return results;
    }

    private void shiftResourceEntries(Project project, int delta) {
        List<ResourceEntry> entries = resourceEntryRepo.findByProjectId(project.getId());

        for (ResourceEntry e : entries) {
            int abs    = e.getYear() * 12 + e.getMonth() + delta;
            e.setMonth((abs - 1) % 12 + 1);
            e.setYear((abs - 1) / 12);
        }
        resourceEntryRepo.saveAll(entries);
    }

    private void shiftPaymentItems(String projectId, int delta) {
        List<PaymentItem> items = paymentItemRepo.findByProject_Id(projectId);
        for (PaymentItem item : items) {
            if (item.isCompleted()) continue; // gerçekleşmiş ödemeler kaymamalı
            if (item.getPlannedMonth() == null || item.getPlannedYear() == null) continue;
            int abs = item.getPlannedYear() * 12 + item.getPlannedMonth() + delta;
            item.setPlannedMonth((abs - 1) % 12 + 1);
            item.setPlannedYear((abs - 1) / 12);
        }
        paymentItemRepo.saveAll(items);
    }

    // ── Potansiyel Siparişler ──────────────────────────────────────────────────

    private List<ShiftedItem> shiftSales(int curYear, int curMonth,
                                          int targetYear, int targetMonth) {
        List<ShiftedItem> results = new ArrayList<>();
        List<PotentialSale> sales = potentialSaleRepo.findAll();

        for (PotentialSale sale : sales) {
            if (sale.getStatus() != PotentialSale.Status.AKTIF) continue;
            int saleAbsolute = sale.getTargetYear() * 12 + sale.getTargetMonth();
            if (saleAbsolute >= curYear * 12 + curMonth) continue;

            String from = sale.getTargetMonth() + "/" + sale.getTargetYear();
            sale.setTargetMonth(targetMonth);
            sale.setTargetYear(targetYear);
            potentialSaleRepo.save(sale);

            String to = targetMonth + "/" + targetYear;
            results.add(new ShiftedItem(
                sale.getId() != null ? sale.getId().toString() : "",
                sale.getName(), from, to
            ));

            activityLogRepo.save(new ActivityLog(
                "POTANSIYEL_SIPARIS", sale.getId(), sale.getName(),
                "AUTO_SHIFT", "system",
                "Hedef tarih " + from + " → " + to
            ));
        }
        return results;
    }
}
