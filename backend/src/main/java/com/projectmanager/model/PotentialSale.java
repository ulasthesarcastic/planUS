package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "potential_sales")
public class PotentialSale {
    @Id
    private String id;

    private String projectId;

    @Column(nullable = false)
    private String name;

    private double amount;
    private String currency;
    private double probability; // 0-100 arası
    private int targetMonth;
    private int targetYear;

    @Enumerated(EnumType.STRING)
    private Status status = Status.AKTIF;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(20) default 'PROJE'")
    private SaleType saleType = SaleType.PROJE;

    public enum Status { AKTIF, KAZANILDI, KAYBEDILDI }
    public enum SaleType { PROJE, SIPARIS }

    public PotentialSale() { this.id = UUID.randomUUID().toString(); }

    // Tahminlenen satış = amount * probability / 100
    @Transient
    public double getEstimatedAmount() {
        return amount * probability / 100.0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public double getProbability() { return probability; }
    public void setProbability(double probability) { this.probability = probability; }
    public int getTargetMonth() { return targetMonth; }
    public void setTargetMonth(int targetMonth) { this.targetMonth = targetMonth; }
    public int getTargetYear() { return targetYear; }
    public void setTargetYear(int targetYear) { this.targetYear = targetYear; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public SaleType getSaleType() { return saleType; }
    public void setSaleType(SaleType saleType) { this.saleType = saleType; }
}
