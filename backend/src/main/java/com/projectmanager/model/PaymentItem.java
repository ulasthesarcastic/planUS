package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "payment_items")
public class PaymentItem {
    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonBackReference("project-payments")
    private Project project;

    private String name;
    private double amount;
    private String currency;
    private Integer plannedMonth;
    private Integer plannedYear;
    private Integer actualMonth;
    private Integer actualYear;
    private Double actualAmount;
    private boolean completed;

    public PaymentItem() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Integer getPlannedMonth() { return plannedMonth; }
    public void setPlannedMonth(Integer plannedMonth) { this.plannedMonth = plannedMonth; }
    public Integer getPlannedYear() { return plannedYear; }
    public void setPlannedYear(Integer plannedYear) { this.plannedYear = plannedYear; }
    public Integer getActualMonth() { return actualMonth; }
    public void setActualMonth(Integer actualMonth) { this.actualMonth = actualMonth; }
    public Integer getActualYear() { return actualYear; }
    public void setActualYear(Integer actualYear) { this.actualYear = actualYear; }
    public Double getActualAmount() { return actualAmount; }
    public void setActualAmount(Double actualAmount) { this.actualAmount = actualAmount; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}
