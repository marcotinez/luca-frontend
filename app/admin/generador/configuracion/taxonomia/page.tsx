'use client';

import Link from 'next/link';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GenerationConfigPatchRequest,
  GenerationConfigResponse,
  getGenerationConfig,
  patchGenerationConfig,
} from '@/lib/config.api';
import { deriveCatalogFromTaxonomy } from '@/lib/generation.utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Download, Loader2, PencilLine, Plus, Save, Settings2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  decodeEscapedSequences,
  getConfigErrorMessage,
  MAX_TERMS_PER_LIST,
  normalizeName,
  TERM_LIST_CONFIG,
  TermListKey,
} from '../_lib/common';

// Estado del editor: a diferencia del contrato del servidor (donde `subcategories`,
// `include_terms`, etc. son opcionales), aquí siempre están poblados con `[]`.
type TaxonomySubcategoryRule = {
  name: string;
  description: string;
  include_terms: string[];
  exclude_terms: string[];
  examples: string[];
};

type TaxonomyCategoryRule = {
  name: string;
  description: string;
  subcategories: TaxonomySubcategoryRule[];
};

type TaxonomyDraft = {
  taxonomy_version: string;
  taxonomy_max_labels_per_item: number;
  taxonomy_allow_fallback_other: boolean;
  taxonomy_categories: TaxonomyCategoryRule[];
};

type CategoryModalState = {
  categoryIndex: number;
  name: string;
  description: string;
};

type SubcategoryModalState = {
  categoryIndex: number;
  subcategoryIndex: number;
  name: string;
  description: string;
  include_terms: string[];
  exclude_terms: string[];
  examples: string[];
  termInputs: Record<TermListKey, string>;
};

type TaxonomyImportPayload = {
  taxonomy_version?: string;
  taxonomy_categories: TaxonomyCategoryRule[];
};

type TaxonomyImportPreview = {
  taxonomy_version?: string;
  taxonomy_categories: TaxonomyCategoryRule[];
  categoryCount: number;
  subcategoryCount: number;
};

const EMPTY_DRAFT: TaxonomyDraft = {
  taxonomy_version: 'v1',
  taxonomy_max_labels_per_item: 2,
  taxonomy_allow_fallback_other: true,
  taxonomy_categories: [],
};

function createEmptyTermInputs(): Record<TermListKey, string> {
  return TERM_LIST_CONFIG.reduce<Record<TermListKey, string>>(
    (acc, listConfig) => {
      acc[listConfig.key] = '';
      return acc;
    },
    {} as Record<TermListKey, string>
  );
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function normalizeImportedSubcategory(raw: unknown): TaxonomySubcategoryRule {
  const obj = (raw ?? {}) as Record<string, unknown>;
  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    throw new Error('Cada subcategoría debe tener `name`.');
  }

  return {
    name: obj.name.trim(),
    description: typeof obj.description === 'string' ? obj.description.trim() : '',
    include_terms: toStringArray(obj.include_terms),
    exclude_terms: toStringArray(obj.exclude_terms),
    examples: toStringArray(obj.examples),
  };
}

function normalizeImportedCategory(raw: unknown): TaxonomyCategoryRule {
  const obj = (raw ?? {}) as Record<string, unknown>;
  if (typeof obj.name !== 'string' || !obj.name.trim()) {
    throw new Error('Cada categoría debe tener `name`.');
  }

  const subcategories = Array.isArray(obj.subcategories) ? obj.subcategories : [];

  return {
    name: obj.name.trim(),
    description: typeof obj.description === 'string' ? obj.description.trim() : '',
    subcategories: subcategories.map(normalizeImportedSubcategory),
  };
}

function normalizeImportedTaxonomy(raw: unknown): TaxonomyImportPayload {
  if (Array.isArray(raw)) {
    return {
      taxonomy_categories: raw.map(normalizeImportedCategory),
    };
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error('El JSON debe ser un objeto o un arreglo de categorías.');
  }

  const obj = raw as Record<string, unknown>;
  const categories = obj.taxonomy_categories;

  if (!Array.isArray(categories)) {
    throw new Error('Falta `taxonomy_categories` o no es un arreglo.');
  }

  const taxonomyVersion =
    typeof obj.taxonomy_version === 'string' && obj.taxonomy_version.trim()
      ? obj.taxonomy_version.trim()
      : undefined;

  return {
    taxonomy_version: taxonomyVersion,
    taxonomy_categories: categories.map(normalizeImportedCategory),
  };
}

function cloneDraftFromConfig(config: GenerationConfigResponse): TaxonomyDraft {
  return {
    taxonomy_version: decodeEscapedSequences(config.taxonomy_version),
    taxonomy_max_labels_per_item: config.taxonomy_max_labels_per_item,
    taxonomy_allow_fallback_other: config.taxonomy_allow_fallback_other,
    taxonomy_categories: config.taxonomy_categories.map((category) => ({
      name: decodeEscapedSequences(category.name),
      description: decodeEscapedSequences(category.description),
      subcategories: (category.subcategories ?? []).map((subcategory) => ({
        name: decodeEscapedSequences(subcategory.name),
        description: decodeEscapedSequences(subcategory.description),
        include_terms: (subcategory.include_terms ?? []).map((item) => decodeEscapedSequences(item)),
        exclude_terms: (subcategory.exclude_terms ?? []).map((item) => decodeEscapedSequences(item)),
        examples: (subcategory.examples ?? []).map((item) => decodeEscapedSequences(item)),
      })),
    })),
  };
}

function createNewCategory(existing: TaxonomyCategoryRule[]): TaxonomyCategoryRule {
  const base = 'Nueva categoría';
  const existingNames = new Set(existing.map((category) => normalizeName(category.name)));

  let candidate = base;
  let suffix = 2;
  while (existingNames.has(normalizeName(candidate))) {
    candidate = `${base} ${suffix}`;
    suffix += 1;
  }

  return {
    name: candidate,
    description: '',
    subcategories: [],
  };
}

function createNewSubcategory(existing: TaxonomySubcategoryRule[]): TaxonomySubcategoryRule {
  const base = 'Nueva subcategoría';
  const existingNames = new Set(existing.map((subcategory) => normalizeName(subcategory.name)));

  let candidate = base;
  let suffix = 2;
  while (existingNames.has(normalizeName(candidate))) {
    candidate = `${base} ${suffix}`;
    suffix += 1;
  }

  return {
    name: candidate,
    description: '',
    include_terms: [],
    exclude_terms: [],
    examples: [],
  };
}

type ListEditorProps = {
  label: string;
  items: string[];
  placeholder: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxItems?: number;
};

function ListEditor({
  label,
  items,
  placeholder,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  maxItems = MAX_TERMS_PER_LIST,
}: ListEditorProps) {
  return (
    <div className="space-y-3 rounded-md border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {items.length}/{maxItems}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin elementos.</p>
      ) : (
        <div className="rounded-md border bg-background">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-start justify-between gap-3 border-b p-3 last:border-b-0"
            >
              <p className="text-sm whitespace-pre-wrap break-words">{item}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-300"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Quitar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionTaxonomiaPage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [draft, setDraft] = useState<TaxonomyDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryModal, setCategoryModal] = useState<CategoryModalState | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<SubcategoryModalState | null>(null);
  const [importPreview, setImportPreview] = useState<TaxonomyImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const derivedCatalog = useMemo(
    () => deriveCatalogFromTaxonomy(draft.taxonomy_categories),
    [draft.taxonomy_categories]
  );

  const isDirty = useMemo(() => {
    if (!config) return false;
    return JSON.stringify(cloneDraftFromConfig(config)) !== JSON.stringify(draft);
  }, [config, draft]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getGenerationConfig();
      setConfig(response);
      setDraft(cloneDraftFromConfig(response));
    } catch (error) {
      toast.error(getConfigErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const openCategoryModal = (categoryIndex: number) => {
    const category = draft.taxonomy_categories[categoryIndex];
    if (!category) return;

    setCategoryModal({
      categoryIndex,
      name: category.name,
      description: category.description,
    });
  };

  const openSubcategoryModal = (categoryIndex: number, subcategoryIndex: number) => {
    const subcategory = draft.taxonomy_categories[categoryIndex]?.subcategories[subcategoryIndex];
    if (!subcategory) return;

    setSubcategoryModal({
      categoryIndex,
      subcategoryIndex,
      name: subcategory.name,
      description: subcategory.description,
      include_terms: [...subcategory.include_terms],
      exclude_terms: [...subcategory.exclude_terms],
      examples: [...subcategory.examples],
      termInputs: createEmptyTermInputs(),
    });
  };

  const handleRestore = () => {
    if (!config) return;
    setDraft(cloneDraftFromConfig(config));
    setCategoryModal(null);
    setSubcategoryModal(null);
    toast.success('Cambios descartados');
  };

  const handleExportTaxonomy = () => {
    const payload = {
      taxonomy_version: draft.taxonomy_version,
      taxonomy_max_labels_per_item: draft.taxonomy_max_labels_per_item,
      taxonomy_allow_fallback_other: draft.taxonomy_allow_fallback_other,
      taxonomy_categories: draft.taxonomy_categories,
      categories: derivedCatalog.categories,
      subtopics: derivedCatalog.subtopics,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const fileName = `taxonomy-${draft.taxonomy_version || 'draft'}.json`;
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);

    toast.success('Taxonomía exportada en JSON');
  };

  const handleOpenImportPicker = () => {
    fileInputRef.current?.click();
  };

  const handleImportTaxonomyFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalized = normalizeImportedTaxonomy(parsed);
      const categoryCount = normalized.taxonomy_categories.length;
      const subcategoryCount = normalized.taxonomy_categories.reduce(
        (acc, category) => acc + category.subcategories.length,
        0
      );

      setImportPreview({
        taxonomy_version: normalized.taxonomy_version,
        taxonomy_categories: normalized.taxonomy_categories,
        categoryCount,
        subcategoryCount,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el JSON.');
    }
  };

  const handleConfirmImportTaxonomy = () => {
    if (!importPreview) return;

    setDraft((prev) => ({
      ...prev,
      taxonomy_version: importPreview.taxonomy_version ?? prev.taxonomy_version,
      taxonomy_categories: importPreview.taxonomy_categories,
    }));

    setCategoryModal(null);
    setSubcategoryModal(null);
    setImportPreview(null);
    toast.success('Taxonomía importada al editor. Guarda cambios para persistirla.');
  };

  const handleSave = async () => {
    const payload: GenerationConfigPatchRequest = {
      taxonomy_version: draft.taxonomy_version.trim(),
      taxonomy_max_labels_per_item: draft.taxonomy_max_labels_per_item,
      taxonomy_allow_fallback_other: draft.taxonomy_allow_fallback_other,
      taxonomy_categories: draft.taxonomy_categories,
      categories: derivedCatalog.categories,
      subtopics: derivedCatalog.subtopics,
    };

    try {
      setIsSaving(true);
      const updated = await patchGenerationConfig(payload);
      setConfig(updated);
      setDraft(cloneDraftFromConfig(updated));
      setCategoryModal(null);
      setSubcategoryModal(null);
      toast.success('Configuración de taxonomía actualizada');
    } catch (error) {
      toast.error(getConfigErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    setDraft((prev) => ({
      ...prev,
      taxonomy_categories: [...prev.taxonomy_categories, createNewCategory(prev.taxonomy_categories)],
    }));
  };

  const handleRemoveCategory = (categoryIndex: number) => {
    setCategoryModal(null);
    setSubcategoryModal(null);
    setDraft((prev) => ({
      ...prev,
      taxonomy_categories: prev.taxonomy_categories.filter((_, idx) => idx !== categoryIndex),
    }));
  };

  const handleAddSubcategory = (categoryIndex: number) => {
    setDraft((prev) => ({
      ...prev,
      taxonomy_categories: prev.taxonomy_categories.map((category, idx) => {
        if (idx !== categoryIndex) return category;
        return {
          ...category,
          subcategories: [...category.subcategories, createNewSubcategory(category.subcategories)],
        };
      }),
    }));
  };

  const handleRemoveSubcategory = (categoryIndex: number, subcategoryIndex: number) => {
    setSubcategoryModal(null);
    setDraft((prev) => ({
      ...prev,
      taxonomy_categories: prev.taxonomy_categories.map((category, idx) => {
        if (idx !== categoryIndex) return category;
        return {
          ...category,
          subcategories: category.subcategories.filter((_, subIdx) => subIdx !== subcategoryIndex),
        };
      }),
    }));
  };

  const handleSaveCategoryModal = () => {
    if (!categoryModal) return;

    setDraft((prev) => ({
      ...prev,
      taxonomy_categories: prev.taxonomy_categories.map((category, idx) => {
        if (idx !== categoryModal.categoryIndex) return category;
        return {
          ...category,
          name: categoryModal.name,
          description: categoryModal.description,
        };
      }),
    }));

    setCategoryModal(null);
  };

  const setSubcategoryTermInput = (listKey: TermListKey, value: string) => {
    setSubcategoryModal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        termInputs: {
          ...prev.termInputs,
          [listKey]: value,
        },
      };
    });
  };

  const handleAddModalTerm = (listKey: TermListKey) => {
    setSubcategoryModal((prev) => {
      if (!prev) return prev;

      const candidate = (prev.termInputs[listKey] || '').trim();
      if (!candidate) return prev;

      const list = prev[listKey];
      if (list.length >= MAX_TERMS_PER_LIST) {
        toast.error(`Límite alcanzado (${MAX_TERMS_PER_LIST}) para ${listKey}`);
        return prev;
      }

      const exists = list.some((item) => normalizeName(item) === normalizeName(candidate));
      if (exists) {
        toast.error('Ese valor ya existe en la lista');
        return prev;
      }

      return {
        ...prev,
        [listKey]: [...list, candidate],
        termInputs: {
          ...prev.termInputs,
          [listKey]: '',
        },
      };
    });
  };

  const handleRemoveModalTerm = (listKey: TermListKey, termIndex: number) => {
    setSubcategoryModal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [listKey]: prev[listKey].filter((_, idx) => idx !== termIndex),
      };
    });
  };

  const handleSaveSubcategoryModal = () => {
    if (!subcategoryModal) return;

    const { categoryIndex, subcategoryIndex, name, description, include_terms, exclude_terms, examples } =
      subcategoryModal;

    setDraft((prev) => ({
      ...prev,
      taxonomy_categories: prev.taxonomy_categories.map((category, idx) => {
        if (idx !== categoryIndex) return category;
        return {
          ...category,
          subcategories: category.subcategories.map((subcategory, subIdx) => {
            if (subIdx !== subcategoryIndex) return subcategory;
            return {
              ...subcategory,
              name,
              description,
              include_terms,
              exclude_terms,
              examples,
            };
          }),
        };
      }),
    }));

    setSubcategoryModal(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Configuración de la taxonomía</h1>
          <p className="text-muted-foreground">Estructura de categorías y reglas globales de clasificación.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {config?.updated_at && (
            <Badge variant="outline">
              Última actualización: {new Date(config.updated_at).toLocaleString('es-CL')}
            </Badge>
          )}
          <Button asChild variant="outline">
            <Link href="/admin/generador/configuracion">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a configuración
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Editor de configuración</CardTitle>
          <CardDescription>Ajusta únicamente variables de taxonomía.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportTaxonomyFile}
          />

          {isLoading ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Cargando configuración...
            </div>
          ) : (
            <Accordion type="multiple" className="rounded-lg border">
              <AccordionItem value="taxonomy-global" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">
                  Parámetros globales
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxonomy-version">Versión taxonomía</Label>
                      <p className="text-xs text-muted-foreground">
                        Identificador de versión usado por el clasificador.
                      </p>
                      <Input
                        id="taxonomy-version"
                        value={draft.taxonomy_version}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, taxonomy_version: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxonomy-max-labels">Max labels por ítem (1-2)</Label>
                      <p className="text-xs text-muted-foreground">
                        Cantidad máxima de etiquetas por entidad o relación clasificada.
                      </p>
                      <Input
                        id="taxonomy-max-labels"
                        type="number"
                        min={1}
                        max={2}
                        value={draft.taxonomy_max_labels_per_item}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          const clamped = Number.isFinite(nextValue)
                            ? Math.max(1, Math.min(2, Math.round(nextValue)))
                            : 2;
                          setDraft((prev) => ({
                            ...prev,
                            taxonomy_max_labels_per_item: clamped,
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="taxonomy-fallback"
                      checked={draft.taxonomy_allow_fallback_other}
                      onCheckedChange={(checked) =>
                        setDraft((prev) => ({
                          ...prev,
                          taxonomy_allow_fallback_other: checked === true,
                        }))
                      }
                    />
                    <Label htmlFor="taxonomy-fallback">{'Permitir fallback "Other"'}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si no hay match claro en la taxonomía, permite usar etiqueta alternativa.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="taxonomy-structure" className="px-4">
                <AccordionTrigger className="text-base hover:no-underline">
                  Estructura de categorías
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Categorías: {draft.taxonomy_categories.length}</Badge>
                      <Badge variant="outline">
                        Subcategorías:{' '}
                        {Object.values(derivedCatalog.subtopics).reduce((acc, list) => acc + list.length, 0)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={handleOpenImportPicker}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar JSON
                      </Button>
                      <Button type="button" variant="outline" onClick={handleExportTaxonomy}>
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                      </Button>
                      <Button type="button" variant="outline" onClick={handleAddCategory}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar categoría
                      </Button>
                    </div>
                  </div>

                  {draft.taxonomy_categories.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                      No hay categorías en la taxonomía.
                    </div>
                  ) : (
                    <Accordion type="multiple" className="rounded-lg border">
                      {draft.taxonomy_categories.map((category, categoryIndex) => (
                        <AccordionItem
                          key={`category-${categoryIndex}`}
                          value={`category-${categoryIndex}`}
                          className="px-4"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{category.name || `Categoría ${categoryIndex + 1}`}</span>
                              <Badge variant="outline">{category.subcategories.length} subcategorías</Badge>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="space-y-4 pb-6">
                            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Descripción:</span>{' '}
                              {category.description.trim() || 'Sin descripción configurada.'}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openCategoryModal(categoryIndex)}
                              >
                                <PencilLine className="mr-2 h-4 w-4" />
                                Editar categoría
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSubcategory(categoryIndex)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar subcategoría
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCategory(categoryIndex)}
                                className="text-red-600 hover:text-red-700 dark:text-red-300"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar categoría
                              </Button>
                            </div>

                            {category.subcategories.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Esta categoría no tiene subcategorías.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {category.subcategories.map((subcategory, subcategoryIndex) => (
                                  <div
                                    key={`subcategory-${categoryIndex}-${subcategoryIndex}`}
                                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-3"
                                  >
                                    <div className="space-y-2">
                                      <p className="font-medium text-sm">
                                        {subcategory.name || `Subcategoría ${subcategoryIndex + 1}`}
                                      </p>
                                      <div className="flex flex-wrap gap-2 text-xs">
                                        <Badge variant="secondary">
                                          Incluye: {subcategory.include_terms.length}
                                        </Badge>
                                        <Badge variant="secondary">
                                          Excluye: {subcategory.exclude_terms.length}
                                        </Badge>
                                        <Badge variant="secondary">Ejemplos: {subcategory.examples.length}</Badge>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openSubcategoryModal(categoryIndex, subcategoryIndex)}
                                      >
                                        <PencilLine className="mr-2 h-4 w-4" />
                                        Editar detalle
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveSubcategory(categoryIndex, subcategoryIndex)
                                        }
                                        className="text-red-600 hover:text-red-700 dark:text-red-300"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleRestore} disabled={!isDirty || isSaving || isLoading}>
              Restaurar valores cargados
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || isSaving || isLoading}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Navegación rápida</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/generador/configuracion/ingesta">
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a ingesta
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/generador/configuracion/generacion">
              <Settings2 className="mr-2 h-4 w-4" />
              Ir a generación
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!categoryModal} onOpenChange={(open) => !open && setCategoryModal(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>
              Ajusta nombre y descripción de la categoría en un solo lugar.
            </DialogDescription>
          </DialogHeader>

          {categoryModal && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-modal-name">Nombre de categoría</Label>
                <Input
                  id="category-modal-name"
                  value={categoryModal.name}
                  onChange={(event) =>
                    setCategoryModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            name: event.target.value,
                          }
                        : prev
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-modal-description">Descripción</Label>
                <Textarea
                  id="category-modal-description"
                  value={categoryModal.description}
                  onChange={(event) =>
                    setCategoryModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            description: event.target.value,
                          }
                        : prev
                    )
                  }
                  className="min-h-36"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCategoryModal(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveCategoryModal}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!importPreview} onOpenChange={(open) => !open && setImportPreview(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar taxonomía desde JSON</DialogTitle>
            <DialogDescription>
              Esta acción reemplaza la taxonomía actualmente cargada en el editor. No mezcla categorías existentes.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Versión detectada</p>
                  <p className="mt-1 font-medium">{importPreview.taxonomy_version || 'Sin cambio'}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Categorías</p>
                  <p className="mt-1 font-medium">{importPreview.categoryCount}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Subcategorías</p>
                  <p className="mt-1 font-medium">{importPreview.subcategoryCount}</p>
                </div>
              </div>

              <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                Se reemplazará la estructura actual del editor por el contenido importado. Luego debes usar
                <span className="font-medium text-foreground"> Guardar cambios </span>
                para persistirla en backend.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportPreview(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmImportTaxonomy}>
              Reemplazar taxonomía en edición
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!subcategoryModal} onOpenChange={(open) => !open && setSubcategoryModal(null)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Editar subcategoría</DialogTitle>
            <DialogDescription>
              Configura descripción, términos y ejemplos desde este modal.
            </DialogDescription>
          </DialogHeader>

          {subcategoryModal && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-5 pb-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subcategory-modal-name">Nombre de subcategoría</Label>
                    <Input
                      id="subcategory-modal-name"
                      value={subcategoryModal.name}
                      onChange={(event) =>
                        setSubcategoryModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                name: event.target.value,
                              }
                            : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subcategory-modal-description">Descripción</Label>
                    <Textarea
                      id="subcategory-modal-description"
                      value={subcategoryModal.description}
                      onChange={(event) =>
                        setSubcategoryModal((prev) =>
                          prev
                            ? {
                                ...prev,
                                description: event.target.value,
                              }
                            : prev
                        )
                      }
                      className="min-h-36"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  {TERM_LIST_CONFIG.map((termConfig) => (
                    <ListEditor
                      key={termConfig.key}
                      label={termConfig.label}
                      items={subcategoryModal[termConfig.key]}
                      placeholder={termConfig.placeholder}
                      inputValue={subcategoryModal.termInputs[termConfig.key] || ''}
                      onInputChange={(value) => setSubcategoryTermInput(termConfig.key, value)}
                      onAdd={() => handleAddModalTerm(termConfig.key)}
                      onRemove={(termIndex) => handleRemoveModalTerm(termConfig.key, termIndex)}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubcategoryModal(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveSubcategoryModal}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
