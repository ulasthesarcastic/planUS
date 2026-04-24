package com.projectmanager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class JpaAuditConfig {

    /**
     * Mevcut oturumu açık kullanıcının adını Spring Data JPA'ya bildirir.
     * @CreatedBy ve @LastModifiedBy anotasyonları bu bean üzerinden dolar.
     */
    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .filter(a -> a.isAuthenticated() && !(a instanceof AnonymousAuthenticationToken))
                .map(Authentication::getName);
    }
}
