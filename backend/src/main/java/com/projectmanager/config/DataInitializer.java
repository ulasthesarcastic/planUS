package com.projectmanager.config;

import com.projectmanager.model.Project;
import com.projectmanager.model.ResourceEntry;
import com.projectmanager.model.User;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProjectRepository projectRepository;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           ProjectRepository projectRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

        // Kategorisiz projeleri "Proje" kategorisine ata
        List<Project> uncategorized = projectRepository.findByCategoryIdIsNull();
        if (!uncategorized.isEmpty()) {
            for (Project p : uncategorized) {
                p.setCategoryId("cat-proje");
                projectRepository.save(p);
            }
            System.out.println(">>> " + uncategorized.size() + " kategorisiz proje 'Proje' kategorisine atandı.");
        }

        // Potansiyel projelerin kaynak planlamalarını proje başlangıç tarihiyle hizala
        fixPotentialProjectPlannings();
    }

    @Transactional
    private void fixPotentialProjectPlannings() {
        List<Project> potProjects = projectRepository.findByProjectStatus("POTANSIYEL");
        int fixed = 0;
        for (Project p : potProjects) {
            if (p.getResourcePlan() == null || p.getResourcePlan().isEmpty()) continue;
            if (p.getStartMonth() <= 0 || p.getStartYear() <= 0) continue;
            if (p.getEndMonth() <= 0 || p.getEndYear() <= 0) continue;

            // En erken entry'yi bul
            int minTotal = Integer.MAX_VALUE;
            int minMonth = -1, minYear = -1;
            for (ResourceEntry e : p.getResourcePlan()) {
                int total = e.getYear() * 12 + e.getMonth();
                if (total < minTotal) {
                    minTotal = total;
                    minMonth = e.getMonth();
                    minYear = e.getYear();
                }
            }
            if (minMonth < 0) continue;

            int offset = (p.getStartYear() * 12 + p.getStartMonth()) - (minYear * 12 + minMonth);
            if (offset == 0) continue;

            // Shift uygula, proje süresi dışındakileri at
            int endTotal = p.getEndYear() * 12 + p.getEndMonth();
            List<ResourceEntry> shifted = new ArrayList<>();
            for (ResourceEntry e : p.getResourcePlan()) {
                int total = (e.getYear() * 12 + e.getMonth() - 1) + offset;
                int newMonth = (total % 12) + 1;
                int newYear = total / 12;
                if (newYear * 12 + newMonth > endTotal) continue;

                ResourceEntry ne = new ResourceEntry();
                ne.setProject(p);
                ne.setPersonnelId(e.getPersonnelId());
                ne.setMonth(newMonth);
                ne.setYear(newYear);
                ne.setNeed(e.getNeed());
                ne.setPlanned(e.getPlanned());
                shifted.add(ne);
            }

            p.setResourcePlan(shifted);
            projectRepository.save(p);
            fixed++;
            System.out.println(">>> Hizalandı: " + p.getName() + " (" + offset + " ay)");
        }
        if (fixed > 0) {
            System.out.println(">>> " + fixed + " potansiyel proje planlaması hizalandı.");
        }
    }

}
