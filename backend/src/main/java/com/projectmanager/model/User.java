package com.projectmanager.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.USER;

    private boolean active = true;

    /** Portföy Yönetimi — tüm projelere tam erişim */
    @Column(nullable = false)
    private boolean portfolioFull = false;

    /** İş Geliştirme — tüm satış/siparişlere tam erişim */
    @Column(nullable = false)
    private boolean busdevFull = false;

    /** Finans — P&L görme yetkisi */
    @Column(nullable = false)
    private boolean pnlAccess = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role { ADMIN, USER }

    public User() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isPortfolioFull() { return portfolioFull; }
    public void setPortfolioFull(boolean portfolioFull) { this.portfolioFull = portfolioFull; }
    public boolean isBusdevFull() { return busdevFull; }
    public void setBusdevFull(boolean busdevFull) { this.busdevFull = busdevFull; }
    public boolean isPnlAccess() { return pnlAccess; }
    public void setPnlAccess(boolean pnlAccess) { this.pnlAccess = pnlAccess; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
