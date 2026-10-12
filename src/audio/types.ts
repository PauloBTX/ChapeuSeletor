import audioManifest from './manifest.json';

/**
 * Types and interfaces for the Sorting Hat Gapless Audio Pipeline
 */

export type AudioCategory = 'abertura' | 'adjetivo1' | 'adjetivo2' | 'transicao' | 'escolha';
export type HogwartsHouse = 'grifinoria' | 'sonserina' | 'corvinal' | 'lufalufa' | 'hogwarts';

export interface SortingTrack {
  category: AudioCategory;
  categoryLabel: string;
  filename: string;
  url: string;
  index: number;
  house?: HogwartsHouse;
  houseName?: string;
  houseColor?: string;
}

export interface AudioEngineCallbacks {
  onSequenceStart?: (tracks: SortingTrack[]) => void;
  onTrackStart?: (track: SortingTrack, index: number, total: number) => void;
  onTrackEnd?: (track: SortingTrack, index: number) => void;
  onSequenceEnd?: () => void;
  onError?: (error: Error, track?: SortingTrack) => void;
}

export type PlaybackEngineMode = 'webaudio' | 'dualplayer';

/**
 * Helper to pick a random element from an array
 */
export function getRandomItem<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

/**
 * Detects house from filename
 */
export function detectHouse(filename: string): { house: HogwartsHouse; name: string; color: string } {
  const lower = filename.toLowerCase();
  if (lower.includes('grifinoria')) {
    return { house: 'grifinoria', name: 'Grifinória', color: '#ae0001' };
  }
  if (lower.includes('sonserina')) {
    return { house: 'sonserina', name: 'Sonserina', color: '#2a623d' };
  }
  if (lower.includes('corvinal')) {
    return { house: 'corvinal', name: 'Corvinal', color: '#222f5b' };
  }
  if (lower.includes('lufalufa')) {
    return { house: 'lufalufa', name: 'Lufa-Lufa', color: '#ecb939' };
  }
  return { house: 'hogwarts', name: 'Hogwarts', color: '#d4af37' };
}

/**
 * Builds the exact 5-track ritual sequence dynamically from the real audio manifest:
 * 1. Abertura (from available aberturas)
 * 2. Adjetivo 1 (from available adjetivos)
 * 3. Adjetivo 2 (from available adjetivos, distinct from Adjetivo 1)
 * 4. Transição (from available transicoes)
 * 5. Escolha da Casa (from available escolhas, e.g. grifinoria, sonserina, corvinal, lufalufa, etc.)
 */
export function generateSortingSequence(basePath: string = 'assets'): SortingTrack[] {
  const aberturasList = audioManifest.aberturas.length > 0 
    ? audioManifest.aberturas 
    : ['aberturas (1).wav'];

  const adjetivosList = audioManifest.adjetivos.length > 0 
    ? audioManifest.adjetivos 
    : ['adjetivos (1).wav'];

  const transicoesList = audioManifest.transicoes.length > 0 
    ? audioManifest.transicoes 
    : ['transicao-casa (1).wav'];

  const escolhasList = audioManifest.escolhas.length > 0 
    ? audioManifest.escolhas 
    : ['escolha-casa (1).wav'];

  const aberturaFile = getRandomItem(aberturasList);

  const adj1File = getRandomItem(adjetivosList);
  let adj2File = getRandomItem(adjetivosList);
  if (adjetivosList.length > 1) {
    while (adj2File === adj1File) {
      adj2File = getRandomItem(adjetivosList);
    }
  }

  const transicaoFile = getRandomItem(transicoesList);
  const escolhaFile = getRandomItem(escolhasList);
  const houseData = detectHouse(escolhaFile);

  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  const tracks: SortingTrack[] = [
    {
      category: 'abertura',
      categoryLabel: 'Abertura do Chapéu',
      filename: aberturaFile,
      url: `${cleanBasePath}/${encodeURIComponent(aberturaFile)}`,
      index: 0
    },
    {
      category: 'adjetivo1',
      categoryLabel: 'Primeiro Julgamento',
      filename: adj1File,
      url: `${cleanBasePath}/${encodeURIComponent(adj1File)}`,
      index: 1
    },
    {
      category: 'adjetivo2',
      categoryLabel: 'Segundo Julgamento',
      filename: adj2File,
      url: `${cleanBasePath}/${encodeURIComponent(adj2File)}`,
      index: 2
    },
    {
      category: 'transicao',
      categoryLabel: 'Decisão do Destino',
      filename: transicaoFile,
      url: `${cleanBasePath}/${encodeURIComponent(transicaoFile)}`,
      index: 3
    },
    {
      category: 'escolha',
      categoryLabel: 'A Casa Escolhida',
      filename: escolhaFile,
      url: `${cleanBasePath}/${encodeURIComponent(escolhaFile)}`,
      index: 4,
      house: houseData.house,
      houseName: houseData.name,
      houseColor: houseData.color
    }
  ];

  return tracks;
}
