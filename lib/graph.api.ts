import type { SearchResponse, GraphStats, SemanticResult, SemanticSearchResponse } from '@/types/graph.types';
import { api } from '@/lib/api';

const API_URL = '/api/v1/graph';

/**
 * Obtiene estadísticas generales del grafo Neo4j
 */
export async function getGraphStats(): Promise<GraphStats> {
  const response = await api.get(`${API_URL}/stats`);
  return response.data;
}

/**
 * Búsqueda textual combinada: entidades + relaciones
 */
export async function searchGraph(query: string, limit: number = 50): Promise<SearchResponse> {
  const response = await api.get(`${API_URL}/search`, {
    params: { query, limit: Math.min(limit, 200) },
  });
  return response.data;
}

/**
 * Búsqueda semántica híbrida (vectorial + fulltext) sobre entidades del grafo.
 * Retorna entidades ordenadas por relevancia semántica con sus relaciones directas.
 *
 * @param query     Pregunta o concepto en lenguaje natural
 * @param limit     Máximo de entidades a retornar (1-50, default 5)
 * @param expandGraph  Si true, incluye las relaciones directas de cada entidad
 */
export async function semanticSearch(
  query: string,
  limit: number = 5,
  expandGraph: boolean = true,
  depth: number = 1
): Promise<SemanticSearchResponse> {
  const response = await api.post(`${API_URL}/semantic-search`, {
    query,
    limit,
    expand_graph: expandGraph,
    depth,
  });
  return response.data;
}

// Re-export type para conveniencia
export type { SemanticResult, SemanticSearchResponse };
