package com.projectmanager.model;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class Seniority {
    private String id;
    private String name;
    private List<SeniorityRate> rates;

    public Seniority() {
        this.id = UUID.randomUUID().toString();
        this.rates = new ArrayList<>();
    }

    public Seniority(String name) {
        this();
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<SeniorityRate> getRates() { return rates; }
    public void setRates(List<SeniorityRate> rates) { this.rates = rates; }
}
