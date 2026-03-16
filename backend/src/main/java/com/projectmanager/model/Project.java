package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projects")
public class Project {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String customerName;
    private String projectType;
    private int startMonth;
    private int startYear;
    private int endMonth;
    private int endYear;
    private double budget;
    private String budgetCurrency;
    private double remainingBudget;
    private double potentialSales;
    private String projectManagerId;
    private String techLeadId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_personnel", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "personnel_id")
    private List<String> personnelIds = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_products", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "product_id")
    private List<String> productIds = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("project-payments")
    private List<PaymentItem> paymentPlan = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("project-milestones")
    private List<Milestone> milestones = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference("project-resources")
    private List<ResourceEntry> resourcePlan = new ArrayList<>();

    public Project() { this.id = UUID.randomUUID().toString(); }

    public double getProjectAmount() {
        if (paymentPlan == null) return 0;
        return paymentPlan.stream().mapToDouble(PaymentItem::getAmount).sum();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProjectType() { return projectType; }
    public void setProjectType(String projectType) { this.projectType = projectType; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public int getStartMonth() { return startMonth; }
    public void setStartMonth(int startMonth) { this.startMonth = startMonth; }
    public int getStartYear() { return startYear; }
    public void setStartYear(int startYear) { this.startYear = startYear; }
    public int getEndMonth() { return endMonth; }
    public void setEndMonth(int endMonth) { this.endMonth = endMonth; }
    public int getEndYear() { return endYear; }
    public void setEndYear(int endYear) { this.endYear = endYear; }
    public double getBudget() { return budget; }
    public void setBudget(double budget) { this.budget = budget; }
    public String getBudgetCurrency() { return budgetCurrency; }
    public void setBudgetCurrency(String budgetCurrency) { this.budgetCurrency = budgetCurrency; }
    public double getRemainingBudget() { return remainingBudget; }
    public void setRemainingBudget(double remainingBudget) { this.remainingBudget = remainingBudget; }
    public double getPotentialSales() { return potentialSales; }
    public void setPotentialSales(double potentialSales) { this.potentialSales = potentialSales; }
    public String getProjectManagerId() { return projectManagerId; }
    public void setProjectManagerId(String projectManagerId) { this.projectManagerId = projectManagerId; }
    public String getTechLeadId() { return techLeadId; }
    public void setTechLeadId(String techLeadId) { this.techLeadId = techLeadId; }
    public List<String> getPersonnelIds() { return personnelIds; }
    public void setPersonnelIds(List<String> personnelIds) { this.personnelIds = personnelIds; }
    public List<String> getProductIds() { return productIds; }
    public void setProductIds(List<String> productIds) { this.productIds = productIds; }
    public List<PaymentItem> getPaymentPlan() { return paymentPlan; }
    public void setPaymentPlan(List<PaymentItem> items) {
        this.paymentPlan.clear();
        if (items != null) { items.forEach(i -> i.setProject(this)); this.paymentPlan.addAll(items); }
    }
    public List<Milestone> getMilestones() { return milestones; }
    public void setMilestones(List<Milestone> items) {
        this.milestones.clear();
        if (items != null) { items.forEach(i -> i.setProject(this)); this.milestones.addAll(items); }
    }
    public List<ResourceEntry> getResourcePlan() { return resourcePlan; }
    public void setResourcePlan(List<ResourceEntry> items) {
        this.resourcePlan.clear();
        if (items != null) { items.forEach(i -> i.setProject(this)); this.resourcePlan.addAll(items); }
    }
}
