import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  projectApi, projectCategoryApi, projectTypeApi,
  personnelApi, seniorityApi, organizationApi,
  productApi, potentialSaleApi,
} from '../services/api';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const QK = {
  workflowSteps:  ['workflowSteps'],
  projects:       ['projects'],
  project:        (id) => ['projects', id],
  categories:     ['categories'],
  projectTypes:   ['projectTypes'],
  personnel:      ['personnel'],
  seniorities:    ['seniorities'],
  organization:   ['organization'],
  products:       ['products'],
  potentialSales: ['potentialSales'],
  potentialSalesByProject: (projectId) => ['potentialSales', 'project', projectId],
};

// ── Ortak ayarlar ─────────────────────────────────────────────────────────────
// Referans veriler (kategori, personel tipi, kıdem) nadiren değişir → uzun cache
const STATIC_OPTIONS  = { staleTime: 5 * 60 * 1000 };   // 5 dk
// Canlı veriler (projeler, potansiyel) → 1 dk sonra arka planda yeniler
const DYNAMIC_OPTIONS = { staleTime: 60 * 1000 };        // 1 dk

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Tüm kategorilerin workflow step'lerini tek sorguda çeker
export function useAllWorkflowSteps(categories) {
  return useQuery({
    queryKey: QK.workflowSteps,
    queryFn: async () => {
      const arrays = await Promise.all(
        (categories || []).map(c =>
          projectCategoryApi.getWorkflow(c.id).then(r => r.data).catch(() => [])
        )
      );
      return arrays.flat();
    },
    enabled: Array.isArray(categories) && categories.length > 0,
    ...STATIC_OPTIONS,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: QK.projects,
    queryFn: () => projectApi.getAll().then(r => r.data),
    ...DYNAMIC_OPTIONS,
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: QK.project(id),
    queryFn: () => projectApi.getById(id).then(r => r.data),
    enabled: !!id,
    ...DYNAMIC_OPTIONS,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: QK.categories,
    queryFn: () => projectCategoryApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function useProjectTypes() {
  return useQuery({
    queryKey: QK.projectTypes,
    queryFn: () => projectTypeApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function usePersonnel() {
  return useQuery({
    queryKey: QK.personnel,
    queryFn: () => personnelApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function useSeniorities() {
  return useQuery({
    queryKey: QK.seniorities,
    queryFn: () => seniorityApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function useOrganization() {
  return useQuery({
    queryKey: QK.organization,
    queryFn: () => organizationApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: QK.products,
    queryFn: () => productApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function usePotentialSales() {
  return useQuery({
    queryKey: QK.potentialSales,
    queryFn: () => potentialSaleApi.getAll().then(r => r.data),
    ...DYNAMIC_OPTIONS,
  });
}

export function usePotentialSalesByProject(projectId) {
  return useQuery({
    queryKey: QK.potentialSalesByProject(projectId),
    queryFn: () => potentialSaleApi.getByProject(projectId).then(r => r.data),
    enabled: !!projectId,
    ...DYNAMIC_OPTIONS,
  });
}

// ── Invalidation helper ───────────────────────────────────────────────────────
// Bir kayıt değişince ilgili cache'leri geçersiz kılar
export function useInvalidate() {
  const qc = useQueryClient();
  return {
    projects:    () => qc.invalidateQueries({ queryKey: QK.projects }),
    project:     (id) => qc.invalidateQueries({ queryKey: QK.project(id) }),
    categories:  () => qc.invalidateQueries({ queryKey: QK.categories }),
    personnel:   () => qc.invalidateQueries({ queryKey: QK.personnel }),
    products:    () => qc.invalidateQueries({ queryKey: QK.products }),
    potentialSales: () => qc.invalidateQueries({ queryKey: QK.potentialSales }),
    all:         () => qc.invalidateQueries(),
  };
}
