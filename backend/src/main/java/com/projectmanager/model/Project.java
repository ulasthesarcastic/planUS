package com.projectmanager.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Project {
    private String id;
    private String name;
    private String customerName;
    private int startMonth;
    private int startYear;
    private int endMonth;
    private int endYear;
    private double budget;
    private String budgetCurrency;
    private String projectManagerId;
    private String techLeadId;

    // Alt listeler
    private List<String> personnelIds = new ArrayList<>();
    private List<String> productIds = new ArrayList<>();
    private List<PaymentItem> paymentPlan = new ArrayList<>();
    private List<Milestone> milestones = new ArrayList<>();
    private List<ResourceEntry> resourcePlan = new ArrayList<>();

    public Project() {
        this.id = UUID.randomUUID().toString();
    }

    // Proje tutarı: ödeme planı kalemlerinin toplamı
    public double getProjectAmount() {
        if (paymentPlan == null) return 0;
        return paymentPlan.stream().mapToDouble(PaymentItem::getAmount).sum();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
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
    public String getProjectManagerId() { return projectManagerId; }
    public void setProjectManagerId(String projectManagerId) { this.projectManagerId = projectManagerId; }
    public String getTechLeadId() { return techLeadId; }
    public void setTechLeadId(String techLeadId) { this.techLeadId = techLeadId; }
    public List<String> getPersonnelIds() { return personnelIds; }
    public void setPersonnelIds(List<String> personnelIds) { this.personnelIds = personnelIds; }
    public List<String> getProductIds() { return productIds; }
    public void setProductIds(List<String> productIds) { this.productIds = productIds; }
    public List<PaymentItem> getPaymentPlan() { return paymentPlan; }
    public void setPaymentPlan(List<PaymentItem> paymentPlan) { this.paymentPlan = paymentPlan; }
    public List<Milestone> getMilestones() { return milestones; }
    public List<ResourceEntry> getResourcePlan() { return resourcePlan; }
    public void setResourcePlan(List<ResourceEntry> resourcePlan) { this.resourcePlan = resourcePlan; }
    public void setMilestones(List<Milestone> milestones) { this.milestones = milestones; }
}
