'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { GenerationConfigResponse, getGenerationConfig } from '@/lib/config.api';
import { backfillGenerationOrigins } from '@/lib/generation.api';
import { useSnapshots } from '@/hooks/useSnapshots';
import { useSelectionRun } from '@/hooks/useSelectionRun';
import { SnapshotForm } from '@/components/generation/SnapshotForm';
import { SnapshotPanel } from '@/components/generation/SnapshotPanel';
import { SelectionRunPanel } from '@/components/generation/SelectionRunPanel';
import { UnitsTable } from '@/components/generation/UnitsTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, WandSparkles } from 'lucide-react';

export default function GeneradorPreguntasPage() {
  const [config, setConfig] = useState<GenerationConfigResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isBackfilling, setIsBackfilling] = useState(false);

  const snapshots = useSnapshots();
  const selectionRun = useSelectionRun(snapshots.activeSnapshotId);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoadingConfig(true);
        setConfig(await getGenerationConfig());
      } catch (error) {
        toast.error(apiErrorMessage(error, 'No se pudo cargar la configuración'));
      } finally {
        setIsLoadingConfig(false);
      }
    };
    void loadConfig();
  }, []);

  const handleBackfill = useCallback(async (force: boolean) => {
    try {
      setIsBackfilling(true);
      const result = await backfillGenerationOrigins(force);
      toast.success(
        `Backfill OK. scanned:${result.scanned_units} updated:${result.updated_questions} sin_question:${result.skipped_without_question} sin_snapshot:${result.skipped_missing_snapshot} ya_origen:${result.skipped_already_present}`
      );
    } catch (error) {
      toast.error(apiErrorMessage(error, 'No se pudo completar el backfill de orígenes'));
    } finally {
      setIsBackfilling(false);
    }
  }, []);

  const { selection } = selectionRun;
  const unitsRefreshKey = `${selection?.selection_id || ''}-${selection?.ok_units ?? 0}-${selection?.failed_units ?? 0}-${selection?.in_progress_units ?? 0}`;

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-3">
            <WandSparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Operación de Generación
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona snapshots y ejecución de lotes en el servidor, con progreso y reanudación.
          </p>
        </div>
        <div className="ml-auto flex w-full flex-col items-start gap-3 sm:w-auto sm:items-end">
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/admin/generador/configuracion">
              <Settings2 className="w-4 h-4 mr-2" />
              Ir a configuraciones
            </Link>
          </Button>
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {config?.updated_at && (
              <Badge variant="outline">Config actualizada: {new Date(config.updated_at).toLocaleString('es-CL')}</Badge>
            )}
            {snapshots.activeSnapshotId && <Badge variant="outline">Snapshot activo: {snapshots.activeSnapshotId}</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <SnapshotForm
          config={config}
          loadingConfig={isLoadingConfig}
          creating={snapshots.isCreating}
          onCreate={(draft) =>
            void snapshots.create({
              category: draft.category,
              subtopic: draft.subtopic === '__ALL__' ? null : draft.subtopic,
              target_difficulties: draft.targetDifficulties,
              question_types: draft.questionTypes.length > 0 ? draft.questionTypes : undefined,
              include_entities: draft.includeEntities,
              include_relations: draft.includeRelations,
            })
          }
        />

        <SnapshotPanel
          snapshots={snapshots.snapshots}
          activeSnapshotId={snapshots.activeSnapshotId}
          onSelect={snapshots.setActiveSnapshotId}
          viewModel={snapshots.viewModel}
          isRefreshing={snapshots.isRefreshing}
          isDeleting={snapshots.isDeleting}
          onRefresh={() => void snapshots.refresh()}
          onDelete={snapshots.remove}
          isBackfilling={isBackfilling}
          onBackfill={handleBackfill}
        />
      </div>

      <SelectionRunPanel
        snapshotId={snapshots.activeSnapshotId}
        availableQuestionTypes={config?.question_type_catalog || []}
        selectionRun={selectionRun}
      />

      <UnitsTable
        snapshotId={snapshots.activeSnapshotId}
        selectionId={selectionRun.selectionId}
        selectionUnitIds={selection?.unit_ids || []}
        refreshKey={unitsRefreshKey}
      />
    </div>
  );
}
