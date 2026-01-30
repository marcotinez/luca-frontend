/**
 * Tipos para la API de Graph Neo4j
 * Base URL: /api/v1/graph
 */

/**
 * Propiedades adicionales de una entidad o relación
 */
export interface EntityProperties {
  id?: string;
  file_origin?: string;
  type?: string;
  source_context?: string;
  [key: string]: unknown;
}

/**
 * Resultado de búsqueda de entidad (nodo)
 */
export interface EntityResult {
  id: string;
  labels: string[];
  name: string | null;
  description: string | null;
  properties: EntityProperties;
}

/**
 * Resultado de búsqueda de relación
 */
export interface RelationshipResult {
  id: string;
  type: string;
  source: EntityResult;
  target: EntityResult;
  properties: {
    description?: string;
    file_origin?: string;
    source_context?: string;
    [key: string]: unknown;
  };
}

/**
 * Respuesta de búsqueda combinada
 */
export interface SearchResponse {
  query: string;
  entities: EntityResult[];
  relationships: RelationshipResult[];
  total_entities: number;
  total_relationships: number;
}

/**
 * Estadísticas del grafo
 */
export interface GraphStats {
  total_nodes: number;
  total_relationships: number;
  labels: string[];
  relationship_types: string[];
}
