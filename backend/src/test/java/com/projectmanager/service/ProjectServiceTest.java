package com.projectmanager.service;

import com.projectmanager.model.Personnel;
import com.projectmanager.model.Project;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.ProjectRepository;
import com.projectmanager.repository.ResourceEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService")
class ProjectServiceTest {

    @Mock ProjectRepository        projectRepository;
    @Mock PersonnelRepository      personnelRepository;
    @Mock ResourceEntryRepository  resourceEntryRepository;

    @InjectMocks ProjectService service;

    // ── Yardımcılar ───────────────────────────────────────────────────────────

    private Project validProject() {
        Project p = new Project();
        p.setName("Test Projesi");
        p.setBudgetCurrency("TL");
        return p;
    }

    private Personnel dummyPersonnel(String id) {
        Personnel p = new Personnel();
        p.setId(id);
        p.setFirstName("Ali");
        p.setLastName("Veli");
        p.setSeniorityId("sen-1");
        return p;
    }

    // ── getAll ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("getAll")
    class GetAll {
        @Test
        @DisplayName("repository'den tüm projeleri döndürür")
        void returnsAllProjects() {
            List<Project> projects = List.of(validProject(), validProject());
            when(projectRepository.findAll()).thenReturn(projects);

            assertThat(service.getAll()).hasSize(2);
            verify(projectRepository).findAll();
        }
    }

    // ── getById ────────────────────────────────────────────────────────────────

    @Nested @DisplayName("getById")
    class GetById {
        @Test
        @DisplayName("var olan ID için projeyi döndürür")
        void returnsProjectWhenFound() {
            Project p = validProject();
            p.setId("proj-1");
            when(projectRepository.findById("proj-1")).thenReturn(Optional.of(p));

            Optional<Project> result = service.getById("proj-1");

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Test Projesi");
        }

        @Test
        @DisplayName("olmayan ID için boş Optional döndürür")
        void returnsEmptyWhenNotFound() {
            when(projectRepository.findById("yok")).thenReturn(Optional.empty());
            assertThat(service.getById("yok")).isEmpty();
        }
    }

    // ── getPaged ───────────────────────────────────────────────────────────────

    @Nested @DisplayName("getPaged")
    class GetPaged {
        @Test
        @DisplayName("filtre parametrelerini repository'ye doğru iletir")
        void delegatesFiltersToRepository() {
            Page<Project> page = new PageImpl<>(List.of(validProject()));
            when(projectRepository.findByFilters(eq("cat-1"), isNull(), eq("POTANSIYEL"), any(Pageable.class)))
                    .thenReturn(page);

            Page<Project> result = service.getPaged(0, 10, "cat-1", null, "POTANSIYEL");

            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("boş string parametreler null'a dönüştürülür")
        void convertsBlankStringsToNull() {
            Page<Project> page = new PageImpl<>(List.of());
            when(projectRepository.findByFilters(isNull(), isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(page);

            service.getPaged(0, 10, "  ", "", "");

            verify(projectRepository).findByFilters(isNull(), isNull(), isNull(), any(Pageable.class));
        }
    }

    // ── create ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("create")
    class Create {
        @Test
        @DisplayName("geçerli proje kaydedilir ve ID atanır")
        void savesProjectWithId() {
            Project input = validProject();
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            Project result = service.create(input);

            assertThat(result.getId()).isNotBlank();
            verify(projectRepository).save(input);
        }

        @Test
        @DisplayName("proje adı boşsa IllegalArgumentException fırlatır")
        void throwsWhenNameIsBlank() {
            Project p = validProject();
            p.setName("   ");

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Proje adı");
        }

        @Test
        @DisplayName("para birimi eksikse IllegalArgumentException fırlatır")
        void throwsWhenCurrencyMissing() {
            Project p = validProject();
            p.setBudgetCurrency(null);

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Para birimi");
        }

        @Test
        @DisplayName("geçersiz proje yöneticisi ID'si IllegalArgumentException fırlatır")
        void throwsWhenProjectManagerNotFound() {
            Project p = validProject();
            p.setProjectManagerId("pm-not-exist");
            when(personnelRepository.findById("pm-not-exist")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("proje yöneticisi");
        }

        @Test
        @DisplayName("geçerli proje yöneticisi ID'siyle kayıt başarılı")
        void savesWithValidProjectManager() {
            Project p = validProject();
            p.setProjectManagerId("pm-1");
            when(personnelRepository.findById("pm-1")).thenReturn(Optional.of(dummyPersonnel("pm-1")));
            when(projectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            assertThatCode(() -> service.create(p)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("geçersiz teknik lider ID'si IllegalArgumentException fırlatır")
        void throwsWhenTechLeadNotFound() {
            Project p = validProject();
            p.setTechLeadId("tl-not-exist");
            when(personnelRepository.findById("tl-not-exist")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("teknik lider");
        }
    }

    // ── update ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("update")
    class Update {
        @Test
        @DisplayName("var olan proje güncellenir")
        void updatesExistingProject() {
            Project existing = validProject();
            existing.setId("proj-1");
            existing.setName("Eski İsim");

            Project updated = validProject();
            updated.setName("Yeni İsim");
            updated.setBudgetCurrency("USD");

            when(projectRepository.findById("proj-1")).thenReturn(Optional.of(existing));
            when(projectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Optional<Project> result = service.update("proj-1", updated);

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Yeni İsim");
            assertThat(result.get().getBudgetCurrency()).isEqualTo("USD");
        }

        @Test
        @DisplayName("olmayan proje için boş Optional döndürür")
        void returnsEmptyWhenNotFound() {
            when(projectRepository.findById("yok")).thenReturn(Optional.empty());
            assertThat(service.update("yok", validProject())).isEmpty();
        }

        @Test
        @DisplayName("güncelleme de validate çalışır; geçersiz isimde hata fırlatır")
        void validatesOnUpdate() {
            Project bad = validProject();
            bad.setName("");

            assertThatThrownBy(() -> service.update("herhangi", bad))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── updatePersonnel ────────────────────────────────────────────────────────

    @Nested @DisplayName("updatePersonnel")
    class UpdatePersonnel {
        @Test
        @DisplayName("proje personel listesini günceller")
        void updatesPersonnelList() {
            Project p = validProject();
            p.setId("proj-1");
            when(projectRepository.findById("proj-1")).thenReturn(Optional.of(p));
            when(projectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Optional<Project> result = service.updatePersonnel("proj-1", List.of("p1", "p2"));

            assertThat(result).isPresent();
            assertThat(result.get().getPersonnelIds()).containsExactly("p1", "p2");
        }
    }

    // ── delete ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("delete")
    class Delete {
        @Test
        @DisplayName("var olan projeyi siler ve true döndürür")
        void deletesExistingProject() {
            when(projectRepository.existsById("proj-1")).thenReturn(true);

            boolean result = service.delete("proj-1");

            assertThat(result).isTrue();
            verify(resourceEntryRepository).deleteByProjectId("proj-1");
            verify(projectRepository).deleteById("proj-1");
        }

        @Test
        @DisplayName("olmayan proje için false döndürür, silme yapılmaz")
        void returnsFalseWhenNotFound() {
            when(projectRepository.existsById("yok")).thenReturn(false);

            boolean result = service.delete("yok");

            assertThat(result).isFalse();
            verify(projectRepository, never()).deleteById(any());
        }
    }
}
