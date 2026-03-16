package com.projectmanager.service;

import com.projectmanager.model.User;
import com.projectmanager.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAll() { return userRepository.findAll(); }
    public Optional<User> getById(String id) { return userRepository.findById(id); }
    public Optional<User> getByUsername(String username) { return userRepository.findByUsername(username); }

    @Transactional
    public User create(User user) {
        if (userRepository.existsByUsername(user.getUsername()))
            throw new IllegalArgumentException("Bu kullanıcı adı zaten alınmış.");
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    @Transactional
    public Optional<User> update(String id, User updated) {
        return userRepository.findById(id).map(existing -> {
            existing.setFullName(updated.getFullName());
            existing.setRole(updated.getRole());
            existing.setActive(updated.isActive());
            if (updated.getPassword() != null && !updated.getPassword().isBlank())
                existing.setPassword(passwordEncoder.encode(updated.getPassword()));
            return userRepository.save(existing);
        });
    }

    @Transactional
    public boolean delete(String id) {
        if (!userRepository.existsById(id)) return false;
        userRepository.deleteById(id);
        return true;
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
