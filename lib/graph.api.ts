import type {
  EntityResult,
  RelationshipResult,
  SearchResponse,
  GraphStats,
} from '@/types/graph.types';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/v1/graph`;

/**
 * Obtiene estadísticas generales del grafo Neo4j
 */
export async function getGraphStats(): Promise<GraphStats> {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
}

/**
 * Busca entidades por nombre o descripción (case-insensitive, CONTAINS)
 * @param query Término de búsqueda
 * @param limit Máximo de resultados (default=50, max=200)
 */
export async function searchEntities(
  query: string,
  limit: number = 50
): Promise<EntityResult[]> {
  const response = await axios.get(`${API_URL}/entities`, {
    params: { query, limit: Math.min(limit, 200) },
  });
  return response.data;
}

/**
 * Busca relaciones por tipo o descripción (case-insensitive, CONTAINS)
 * @param query Término de búsqueda
 * @param limit Máximo de resultados (default=50, max=200)
 */
export async function searchRelationships(
  query: string,
  limit: number = 50
): Promise<RelationshipResult[]> {
  const response = await axios.get(`${API_URL}/relationships`, {
    params: { query, limit: Math.min(limit, 200) },
  });
  return response.data;
}

/**
 * Búsqueda combinada de entidades y relaciones
 * @param query Término de búsqueda
 * @param limit Máximo de resultados por tipo (default=50, max=200)
 */
export async function searchGraph(
  query: string,
  limit: number = 50
): Promise<SearchResponse> {
  const response = await axios.get(`${API_URL}/search`, {
    params: { query, limit: Math.min(limit, 200) },
  });
  return response.data;
}
