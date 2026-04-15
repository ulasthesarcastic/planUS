package com.projectmanager.config;

import com.projectmanager.model.Project;
import com.projectmanager.model.ProjectCategory;
import com.projectmanager.model.User;
import com.projectmanager.repository.ProjectCategoryRepository;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProjectCategoryRepository categoryRepository;
    private final ProjectRepository projectRepository;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           ProjectCategoryRepository categoryRepository,
                           ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Yönetici");
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
            System.out.println(">>> Admin kullanıcısı oluşturuldu: admin / admin123");
        }

        createDefaultCategoryIfAbsent("cat-proje", "Proje", "#6366f1", ProjectCategory.CategoryType.PROJE, 1);
        createDefaultCategoryIfAbsent("cat-urun", "Ürün", "#f59e0b", ProjectCategory.CategoryType.URUN, 2);
        createDefaultCategoryIfAbsent("cat-hizmet", "Hizmet", "#10b981", ProjectCategory.CategoryType.HIZMET, 3);

        // Kategorisiz projeleri "Proje" kategorisine ata
        List<Project> uncategorized = projectRepository.findByCategoryIdIsNull();
        if (!uncategorized.isEmpty()) {
            for (Project p : uncategorized) {
                p.setCategoryId("cat-proje");
                projectRepository.save(p);
            }
            System.out.println(">>> " + uncategorized.size() + " kategorisiz proje 'Proje' kategorisine atandı.");
        }
    }

    private void createDefaultCategoryIfAbsent(String id, String name, String color,
                                                ProjectCategory.CategoryType type, int order) {
        if (!categoryRepository.existsById(id)) {
            ProjectCategory cat = new ProjectCategory();
            cat.setId(id);
            cat.setName(name);
            cat.setColor(color);
            cat.setCategoryType(type);
            cat.setStepOrder(order);
            categoryRepository.save(cat);
            System.out.println(">>> Varsayılan kategori oluşturuldu: " + name);
        }
    }
}
