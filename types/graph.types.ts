
// Propiedades adicionales de una entidad o relación
export interface EntityProperties {
  id?: string;
  file_origin?: string;
  type?: string;
  source_context?: string;
  [key: string]: unknown;
}

// Resultado de búsqueda de entidad (nodo)
export interface EntityResult {
  id: string;
  labels: string[];
  name: string | null;
  description: string | null;
  properties: EntityProperties;
}

// Resultado de búsqueda de relación
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

// Respuesta de búsqueda combinada (textual)
export interface SearchResponse {
  query: string;
  entities: EntityResult[];
  relationships: RelationshipResult[];
  total_entities: number;
  total_relationships: number;
}

// Una arista del subgrafo expandido, con nivel de profundidad
export interface SubgraphEdge {
  source: string;
  relation: string;
  rel_description?: string | null;
  target: string;
  target_description?: string | null;
  depth: number; // 1 = directo, 2 = segundo salto, etc.
}

// Resultado individual de búsqueda semántica (nuevo formato)
export interface SemanticResult {
  concepto: string;
  definicion?: string | null;
  tipo?: string | null;
  source_context?: string | null;
  file_origin?: string | null;
  subgraph: SubgraphEdge[];
  score: number;
  search_type: 'vector' | 'fulltext';
}

// Respuesta completa del endpoint /semantic-search
export interface SemanticSearchResponse {
  query: string;
  total: number;
  depth: number;
  results: SemanticResult[];
}

// Estadísticas del grafo
export interface GraphStats {
  total_nodes: number;
  total_relationships: number;
  labels: string[];
  relationship_types: string[];
}
