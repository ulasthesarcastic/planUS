package com.projectmanager.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "general_expenses")
public class GeneralExpense {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private double amount;

    @Column(name = "start_month", nullable = false)
    private int startMonth;

    @Column(name = "start_year", nullable = false)
    private int startYear;

    @Column(name = "end_month", nullable = false)
    private int endMonth;

    @Column(name = "end_year", nullable = false)
    private int endYear;

    public GeneralExpense() { this.id = UUID.randomUUID().toString(); }

    public String getId()            { return id; }
    public void   setId(String id)   { this.id = id; }
    public String getName()          { return name; }
    public void   setName(String n)  { this.name = n; }
    public double getAmount()        { return amount; }
    public void   setAmount(double a){ this.amount = a; }
    public int    getStartMonth()    { return startMonth; }
    public void   setStartMonth(int m){ this.startMonth = m; }
    public int    getStartYear()     { return startYear; }
    public void   setStartYear(int y){ this.startYear = y; }
    public int    getEndMonth()      { return endMonth; }
    public void   setEndMonth(int m) { this.endMonth = m; }
    public int    getEndYear()       { return endYear; }
    public void   setEndYear(int y)  { this.endYear = y; }
}
