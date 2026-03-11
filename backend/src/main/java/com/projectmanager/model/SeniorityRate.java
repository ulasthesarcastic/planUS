package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class SeniorityRate {
    private int startYear;
    private int startMonth; // 1-12
    private Integer endYear;   // null = open-ended (still active)
    private Integer endMonth;  // null = open-ended
    private double amount;
    private String currency;   // TL, USD, EUR, GBP, etc.

    public SeniorityRate() {}

    public SeniorityRate(int startYear, int startMonth, Integer endYear, Integer endMonth,
                         double amount, String currency) {
        this.startYear = startYear;
        this.startMonth = startMonth;
        this.endYear = endYear;
        this.endMonth = endMonth;
        this.amount = amount;
        this.currency = currency;
    }

    public int getStartYear() { return startYear; }
    public void setStartYear(int startYear) { this.startYear = startYear; }

    public int getStartMonth() { return startMonth; }
    public void setStartMonth(int startMonth) { this.startMonth = startMonth; }

    public Integer getEndYear() { return endYear; }
    public void setEndYear(Integer endYear) { this.endYear = endYear; }

    public Integer getEndMonth() { return endMonth; }
    public void setEndMonth(Integer endMonth) { this.endMonth = endMonth; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
