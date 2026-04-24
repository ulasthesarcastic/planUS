package com.projectmanager.service;

import com.projectmanager.model.Personnel;
import com.projectmanager.model.Seniority;
import com.projectmanager.repository.PersonnelRepository;
import com.projectmanager.repository.SeniorityRepository;
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
@DisplayName("PersonnelService")
class PersonnelServiceTest {

    @Mock PersonnelRepository personnelRepository;
    @Mock SeniorityRepository seniorityRepository;

    @InjectMocks PersonnelService service;

    // ── Yardımcılar ───────────────────────────────────────────────────────────

    private Personnel validPersonnel() {
        Personnel p = new Personnel();
        p.setFirstName("Ayşe");
        p.setLastName("Kaya");
        p.setSeniorityId("sen-1");
        return p;
    }

    private Seniority dummySeniority(String id) {
        Seniority s = new Seniority();
        s.setId(id);
        s.setName("Uzman");
        return s;
    }

    // ── getAll ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("getAll")
    class GetAll {
        @Test
        @DisplayName("tüm personel listesini döndürür")
        void returnsAll() {
            when(personnelRepository.findAll()).thenReturn(List.of(validPersonnel(), validPersonnel()));
            assertThat(service.getAll()).hasSize(2);
        }
    }

    // ── search ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("search")
    class Search {
        @Test
        @DisplayName("q ve unitId parametrelerini repository'ye iletir")
        void delegatesSearchToRepository() {
            Page<Personnel> page = new PageImpl<>(List.of(validPersonnel()));
            when(personnelRepository.search(eq("birim-1"), eq("ali"), any(Pageable.class)))
                    .thenReturn(page);

            Page<Personnel> result = service.search("ali", "birim-1", 0, 20);

            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("boş q ve unitId null'a dönüştürülür")
        void convertsBlankToNull() {
            Page<Personnel> page = new PageImpl<>(List.of());
            when(personnelRepository.search(isNull(), isNull(), any(Pageable.class)))
                    .thenReturn(page);

            service.search("  ", "  ", 0, 20);

            verify(personnelRepository).search(isNull(), isNull(), any(Pageable.class));
        }
    }

    // ── create ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("create")
    class Create {
        @Test
        @DisplayName("geçerli personel kaydedilir ve ID atanır")
        void savesPersonnelWithId() {
            Personnel input = validPersonnel();
            when(seniorityRepository.findById("sen-1")).thenReturn(Optional.of(dummySeniority("sen-1")));
            when(personnelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Personnel result = service.create(input);

            assertThat(result.getId()).isNotBlank();
            verify(personnelRepository).save(input);
        }

        @Test
        @DisplayName("seniorityId null ise IllegalArgumentException fırlatır")
        void throwsWhenSeniorityNull() {
            Personnel p = validPersonnel();
            p.setSeniorityId(null);

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Kıdem");
        }

        @Test
        @DisplayName("seniorityId boş string ise IllegalArgumentException fırlatır")
        void throwsWhenSeniorityBlank() {
            Personnel p = validPersonnel();
            p.setSeniorityId("  ");

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Kıdem");
        }

        @Test
        @DisplayName("geçersiz seniorityId ise IllegalArgumentException fırlatır")
        void throwsWhenSeniorityNotFound() {
            Personnel p = validPersonnel();
            p.setSeniorityId("olmayan-sen");
            when(seniorityRepository.findById("olmayan-sen")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.create(p))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("olmayan-sen");
        }
    }

    // ── update ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("update")
    class Update {
        @Test
        @DisplayName("var olan personel ad, soyad ve kıdemini günceller")
        void updatesFields() {
            Personnel existing = validPersonnel();
            existing.setId("p-1");
            existing.setFirstName("Eski");

            Personnel updated = validPersonnel();
            updated.setFirstName("Yeni");
            updated.setSeniorityId("sen-2");

            when(seniorityRepository.findById("sen-2")).thenReturn(Optional.of(dummySeniority("sen-2")));
            when(personnelRepository.findById("p-1")).thenReturn(Optional.of(existing));
            when(personnelRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Optional<Personnel> result = service.update("p-1", updated);

            assertThat(result).isPresent();
            assertThat(result.get().getFirstName()).isEqualTo("Yeni");
            assertThat(result.get().getSeniorityId()).isEqualTo("sen-2");
        }

        @Test
        @DisplayName("olmayan personel için boş Optional döndürür")
        void returnsEmptyWhenNotFound() {
            when(seniorityRepository.findById(any())).thenReturn(Optional.of(dummySeniority("sen-1")));
            when(personnelRepository.findById("yok")).thenReturn(Optional.empty());

            assertThat(service.update("yok", validPersonnel())).isEmpty();
        }
    }

    // ── delete ─────────────────────────────────────────────────────────────────

    @Nested @DisplayName("delete")
    class Delete {
        @Test
        @DisplayName("var olan personeli siler ve true döndürür")
        void deletesExistingPersonnel() {
            when(personnelRepository.existsById("p-1")).thenReturn(true);

            boolean result = service.delete("p-1");

            assertThat(result).isTrue();
            verify(personnelRepository).deleteById("p-1");
        }

        @Test
        @DisplayName("olmayan personel için false döndürür, deleteById çağrılmaz")
        void returnsFalseWhenNotFound() {
            when(personnelRepository.existsById("yok")).thenReturn(false);

            assertThat(service.delete("yok")).isFalse();
            verify(personnelRepository, never()).deleteById(any());
        }
    }
}
