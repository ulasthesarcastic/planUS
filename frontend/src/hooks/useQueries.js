import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  projectApi, projectCategoryApi, projectTypeApi,
  personnelApi, seniorityApi, organizationApi,
  productApi, potentialSaleApi, costTypeApi, projectCostApi, procurementApi,
} from '../services/api';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const QK = {
  workflowSteps:  ['workflowSteps'],
  projects:       ['projects'],
  project:        (id) => ['projects', id],
  projectsPaged:  (categoryId, page) => ['projects', 'paged', categoryId, page],
  categories:     ['categories'],
  projectTypes:   ['projectTypes'],
  personnel:      ['personnel'],
  seniorities:    ['seniorities'],
  organization:   ['organization'],
  products:       ['products'],
  potentialSales: ['potentialSales'],
  potentialSalesByProject: (projectId) => ['potentialSales', 'project', projectId],
  costTypes:      ['costTypes'],
  projectCosts:   (projectId) => ['projectCosts', projectId],
  allProjectCosts: ['allProjectCosts'],
  siparisler:     ['siparisler'],
  seniorityHistory: (id) => ['seniorityHistory', id],
  allSeniorityHistory: ['allSeniorityHistory'],
  procurements:    (projectId) => ['procurements', projectId],
  allProcurements: ['allProcurements'],
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

export function useProjects({ enabled = true } = {}) {
  return useQuery({
    queryKey: QK.projects,
    queryFn: () => projectApi.getAll().then(r => r.data),
    enabled,
    ...DYNAMIC_OPTIONS,
  });
}

// Kategori sayfaları için sayfalandırılmış proje sorgusu
// Spring Page<Project> döner: { content, totalPages, totalElements, number, size }
export function useProjectsPaged(categoryId, page = 0, size = 24) {
  return useQuery({
    queryKey: QK.projectsPaged(categoryId, page),
    queryFn: () =>
      projectApi.getPaged({ categoryId, excludeStatus: 'POTANSIYEL', page, size })
        .then(r => r.data),
    enabled: !!categoryId,
    placeholderData: keepPreviousData,  // sayfa geçişlerinde eski veri görünmeye devam eder
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

// Kazanılmış siparişler (KAZANILDI statüsündeki SIPARIS tipindekiler)
export function useSiparisler() {
  return useQuery({
    queryKey: QK.siparisler,
    queryFn: () => potentialSaleApi.getAll().then(r =>
      r.data.filter(s => s.saleType === 'SIPARIS' && s.status === 'KAZANILDI')
    ),
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

export function useCostTypes() {
  return useQuery({
    queryKey: QK.costTypes,
    queryFn: () => costTypeApi.getAll().then(r => r.data),
    ...STATIC_OPTIONS,
  });
}

export function useProjectCosts(projectId) {
  return useQuery({
    queryKey: QK.projectCosts(projectId),
    queryFn: () => projectCostApi.getByProject(projectId).then(r => r.data),
    enabled: !!projectId,
    ...DYNAMIC_OPTIONS,
  });
}

export function useAllProjectCosts() {
  return useQuery({
    queryKey: QK.allProjectCosts,
    queryFn: () => projectCostApi.getAll().then(r => r.data),
    ...DYNAMIC_OPTIONS,
  });
}

export function usePersonnelSeniorityHistory(personnelId) {
  return useQuery({
    queryKey: QK.seniorityHistory(personnelId),
    queryFn: () => personnelApi.getSeniorityHistory(personnelId).then(r => r.data),
    enabled: !!personnelId,
    ...DYNAMIC_OPTIONS,
  });
}

export function useAllSeniorityHistory() {
  return useQuery({
    queryKey: QK.allSeniorityHistory,
    queryFn: () => personnelApi.getAllSeniorityHistory().then(r => r.data),
    ...DYNAMIC_OPTIONS,
  });
}

export function useProcurements(projectId) {
  return useQuery({
    queryKey: QK.procurements(projectId),
    queryFn: () => procurementApi.getByProject(projectId).then(r => r.data),
    enabled: !!projectId,
    retry: 0,
    ...DYNAMIC_OPTIONS,
  });
}

export function useAllProcurements() {
  return useQuery({
    queryKey: QK.allProcurements,
    queryFn: () => procurementApi.getAll().then(r => r.data),
    retry: 0,
    ...DYNAMIC_OPTIONS,
  });
}

// ── Invalidation helper ───────────────────────────────────────────────────────
// Bir kayıt değişince ilgili cache'leri geçersiz kılar
export function useInvalidate() {
  const qc = useQueryClient();
  return {
    projects:     () => qc.invalidateQueries({ queryKey: QK.projects }),
    project:      (id) => qc.invalidateQueries({ queryKey: QK.project(id) }),
    categories:   () => qc.invalidateQueries({ queryKey: QK.categories }),
    projectTypes: () => qc.invalidateQueries({ queryKey: QK.projectTypes }),
    personnel:    () => qc.invalidateQueries({ queryKey: QK.personnel }),
    products:     () => qc.invalidateQueries({ queryKey: QK.products }),
    potentialSales: () => {
      qc.invalidateQueries({ queryKey: QK.potentialSales });
      qc.invalidateQueries({ queryKey: QK.siparisler });
    },
    costTypes:       () => qc.invalidateQueries({ queryKey: QK.costTypes }),
    projectCosts:    (id) => qc.invalidateQueries({ queryKey: QK.projectCosts(id) }),
    allProjectCosts: () => qc.invalidateQueries({ queryKey: QK.allProjectCosts }),
    seniorityHistory: (id) => {
      qc.invalidateQueries({ queryKey: QK.seniorityHistory(id) });
      qc.invalidateQueries({ queryKey: QK.allSeniorityHistory });
    },
    procurements: (id) => {
      qc.invalidateQueries({ queryKey: QK.procurements(id) });
      qc.invalidateQueries({ queryKey: QK.allProcurements });
    },
    all:          () => qc.invalidateQueries(),
  };
}
