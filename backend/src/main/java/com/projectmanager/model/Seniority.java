package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "seniorities")
public class Seniority {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @OneToMany(mappedBy = "seniority", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<SeniorityRate> rates = new ArrayList<>();

    public Seniority() { this.id = UUID.randomUUID().toString(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<SeniorityRate> getRates() { return rates; }
    public void setRates(List<SeniorityRate> rates) {
        this.rates.clear();
        if (rates != null) {
            rates.forEach(r -> r.setSeniority(this));
            this.rates.addAll(rates);
        }
    }
}
