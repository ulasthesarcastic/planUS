package com.projectmanager.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Brute-force koruması: 5 başarısız denemeden sonra 15 dakika kilitleme.
 * In-memory — uygulama yeniden başlatıldığında sıfırlanır.
 */
@Service
public class LoginAttemptService {

    private static final int  MAX_ATTEMPTS   = 5;
    private static final long LOCK_DURATION_MS = 15 * 60 * 1000L; // 15 dakika

    private record AttemptInfo(int count, Instant lockedUntil) {}

    private final ConcurrentHashMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();

    /** Başarısız girişi kaydet. */
    public void loginFailed(String username) {
        attempts.compute(username.toLowerCase(), (k, v) -> {
            if (v == null) return new AttemptInfo(1, null);
            int newCount = v.count() + 1;
            Instant lock = newCount >= MAX_ATTEMPTS
                ? Instant.now().plusMillis(LOCK_DURATION_MS)
                : v.lockedUntil();
            return new AttemptInfo(newCount, lock);
        });
    }

    /** Başarılı girişte sayacı sıfırla. */
    public void loginSucceeded(String username) {
        attempts.remove(username.toLowerCase());
    }

    /** Hesap kilitli mi? */
    public boolean isBlocked(String username) {
        AttemptInfo info = attempts.get(username.toLowerCase());
        if (info == null || info.lockedUntil() == null) return false;
        if (Instant.now().isAfter(info.lockedUntil())) {
            attempts.remove(username.toLowerCase()); // kilit süresi dolmuş
            return false;
        }
        return true;
    }

    /** Kalan kilit süresini dakika olarak döndür (UI mesajı için). */
    public long remainingMinutes(String username) {
        AttemptInfo info = attempts.get(username.toLowerCase());
        if (info == null || info.lockedUntil() == null) return 0;
        long ms = info.lockedUntil().toEpochMilli() - Instant.now().toEpochMilli();
        return Math.max(1, (ms / 60000) + 1);
    }
}
