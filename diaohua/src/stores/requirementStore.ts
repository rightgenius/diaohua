import { create } from 'zustand';
import type { Requirement, Screenshot, MockupDesign, Annotation } from '@/types';

interface RequirementState {
  currentRequirement: Requirement | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createRequirement: (projectId: string, title: string) => Requirement;
  updateRequirement: (updates: Partial<Requirement>) => void;
  addScreenshot: (screenshot: Screenshot) => void;
  updateScreenshot: (screenshotId: string, updates: Partial<Screenshot>) => void;
  removeScreenshot: (screenshotId: string) => void;
  updateAnnotations: (screenshotId: string, annotations: Annotation[]) => void;
  addMockupDesigns: (mockups: MockupDesign[]) => void;
  selectMockup: (mockupId: string) => void;
  setStatus: (status: Requirement['status']) => void;
  clearCurrentRequirement: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useRequirementStore = create<RequirementState>((set, get) => ({
  currentRequirement: null,
  isLoading: false,
  error: null,
  
  createRequirement: (projectId: string, title: string) => {
    const newRequirement: Requirement = {
      id: generateId(),
      projectId,
      title,
      status: 'draft',
      priority: 'medium',
      creatorId: 'current-user',
      tags: [],
      screenshots: [],
      userDescription: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ currentRequirement: newRequirement });
    return newRequirement;
  },
  
  updateRequirement: (updates: Partial<Requirement>) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  addScreenshot: (screenshot: Screenshot) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        screenshots: [...currentRequirement.screenshots, screenshot],
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  updateScreenshot: (screenshotId: string, updates: Partial<Screenshot>) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        screenshots: currentRequirement.screenshots.map((s) =>
          s.id === screenshotId ? { ...s, ...updates } : s
        ),
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  removeScreenshot: (screenshotId: string) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        screenshots: currentRequirement.screenshots.filter(
          (s) => s.id !== screenshotId
        ),
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  updateAnnotations: (screenshotId: string, annotations: Annotation[]) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        screenshots: currentRequirement.screenshots.map((s) =>
          s.id === screenshotId ? { ...s, annotations } : s
        ),
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  addMockupDesigns: (mockups: MockupDesign[]) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    const existingMockups = currentRequirement.mockupDesigns || [];
    set({
      currentRequirement: {
        ...currentRequirement,
        mockupDesigns: [...existingMockups, ...mockups],
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  selectMockup: (mockupId: string) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        mockupDesigns: (currentRequirement.mockupDesigns || []).map((m) => ({
          ...m,
          selected: m.id === mockupId,
        })),
        selectedMockupId: mockupId,
        status: 'designing',
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  setStatus: (status: Requirement['status']) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;
    
    set({
      currentRequirement: {
        ...currentRequirement,
        status,
        updatedAt: new Date().toISOString(),
      },
    });
  },
  
  clearCurrentRequirement: () => {
    set({ currentRequirement: null, error: null });
  },
}));
