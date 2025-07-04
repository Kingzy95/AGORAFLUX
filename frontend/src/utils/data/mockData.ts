import { 
  ChartDataPoint, 
  TimeSeriesData, 
  BudgetData, 
  GeographicData, 
  StatisticsData 
} from '../../types/visualization';

// Données budgétaires de Paris 2024
export const mockBudgetData: BudgetData[] = [
  {
    category: 'Éducation',
    amount: 1240000000,
    percentage: 31.2,
    color: '#1976d2',
    subcategories: [
      { category: 'Écoles primaires', amount: 520000000, percentage: 42.0, color: '#42a5f5' },
      { category: 'Collèges et lycées', amount: 380000000, percentage: 30.6, color: '#64b5f6' },
      { category: 'Universités', amount: 250000000, percentage: 20.2, color: '#90caf9' },
      { category: 'Formation continue', amount: 90000000, percentage: 7.2, color: '#bbdefb' }
    ]
  },
  {
    category: 'Transport',
    amount: 890000000,
    percentage: 22.4,
    color: '#388e3c',
    subcategories: [
      { category: 'Métro et RER', amount: 420000000, percentage: 47.2, color: '#66bb6a' },
      { category: 'Bus', amount: 280000000, percentage: 31.5, color: '#81c784' },
      { category: 'Vélib et mobilité douce', amount: 120000000, percentage: 13.5, color: '#a5d6a7' },
      { category: 'Infrastructure routière', amount: 70000000, percentage: 7.8, color: '#c8e6c9' }
    ]
  },
  {
    category: 'Logement',
    amount: 650000000,
    percentage: 16.4,
    color: '#f57c00',
    subcategories: [
      { category: 'Logement social', amount: 380000000, percentage: 58.5, color: '#ffb74d' },
      { category: 'Rénovation urbaine', amount: 180000000, percentage: 27.7, color: '#ffcc02' },
      { category: 'Aide au logement', amount: 90000000, percentage: 13.8, color: '#ffe082' }
    ]
  },
  {
    category: 'Santé',
    amount: 520000000,
    percentage: 13.1,
    color: '#d32f2f',
    subcategories: [
      { category: 'Hôpitaux publics', amount: 280000000, percentage: 53.8, color: '#f44336' },
      { category: 'Centres de santé', amount: 150000000, percentage: 28.9, color: '#e57373' },
      { category: 'Prévention', amount: 90000000, percentage: 17.3, color: '#ffcdd2' }
    ]
  },
  {
    category: 'Environnement',
    amount: 420000000,
    percentage: 10.6,
    color: '#7b1fa2',
    subcategories: [
      { category: 'Espaces verts', amount: 180000000, percentage: 42.9, color: '#9c27b0' },
      { category: 'Gestion des déchets', amount: 140000000, percentage: 33.3, color: '#ba68c8' },
      { category: 'Transition énergétique', amount: 100000000, percentage: 23.8, color: '#ce93d8' }
    ]
  },
  {
    category: 'Culture et Sports',
    amount: 250000000,
    percentage: 6.3,
    color: '#455a64',
    subcategories: [
      { category: 'Équipements sportifs', amount: 120000000, percentage: 48.0, color: '#607d8b' },
      { category: 'Bibliothèques et musées', amount: 80000000, percentage: 32.0, color: '#78909c' },
      { category: 'Événements culturels', amount: 50000000, percentage: 20.0, color: '#90a4ae' }
    ]
  }
];

// Évolution budgétaire sur 5 ans
export const mockBudgetEvolution: TimeSeriesData[] = [
  { date: '2020', value: 3800000000, category: 'Budget total' },
  { date: '2021', value: 3950000000, category: 'Budget total' },
  { date: '2022', value: 3720000000, category: 'Budget total' },
  { date: '2023', value: 3890000000, category: 'Budget total' },
  { date: '2024', value: 3970000000, category: 'Budget total' },

  { date: '2020', value: 1180000000, category: 'Éducation' },
  { date: '2021', value: 1220000000, category: 'Éducation' },
  { date: '2022', value: 1160000000, category: 'Éducation' },
  { date: '2023', value: 1210000000, category: 'Éducation' },
  { date: '2024', value: 1240000000, category: 'Éducation' },

  { date: '2020', value: 820000000, category: 'Transport' },
  { date: '2021', value: 750000000, category: 'Transport' },
  { date: '2022', value: 680000000, category: 'Transport' },
  { date: '2023', value: 840000000, category: 'Transport' },
  { date: '2024', value: 890000000, category: 'Transport' }
];

// Données de participation citoyenne par arrondissement
export const mockParticipationData: GeographicData[] = [
  { id: '75001', name: '1er arrondissement', value: 342, coordinates: [48.8606, 2.3376] },
  { id: '75002', name: '2e arrondissement', value: 156, coordinates: [48.8679, 2.3408] },
  { id: '75003', name: '3e arrondissement', value: 289, coordinates: [48.8635, 2.3619] },
  { id: '75004', name: '4e arrondissement', value: 198, coordinates: [48.8550, 2.3534] },
  { id: '75005', name: '5e arrondissement', value: 445, coordinates: [48.8445, 2.3471] },
  { id: '75006', name: '6e arrondissement', value: 234, coordinates: [48.8462, 2.3372] },
  { id: '75007', name: '7e arrondissement', value: 187, coordinates: [48.8534, 2.3112] },
  { id: '75008', name: '8e arrondissement', value: 298, coordinates: [48.8718, 2.3141] },
  { id: '75009', name: '9e arrondissement', value: 367, coordinates: [48.8751, 2.3383] },
  { id: '75010', name: '10e arrondissement', value: 521, coordinates: [48.8760, 2.3619] },
  { id: '75011', name: '11e arrondissement', value: 634, coordinates: [48.8594, 2.3765] },
  { id: '75012', name: '12e arrondissement', value: 478, coordinates: [48.8352, 2.3889] },
  { id: '75013', name: '13e arrondissement', value: 392, coordinates: [48.8322, 2.3561] },
  { id: '75014', name: '14e arrondissement', value: 356, coordinates: [48.8335, 2.3224] },
  { id: '75015', name: '15e arrondissement', value: 567, coordinates: [48.8394, 2.2979] },
  { id: '75016', name: '16e arrondissement', value: 298, coordinates: [48.8662, 2.2731] },
  { id: '75017', name: '17e arrondissement', value: 423, coordinates: [48.8848, 2.3059] },
  { id: '75018', name: '18e arrondissement', value: 512, coordinates: [48.8927, 2.3436] },
  { id: '75019', name: '19e arrondissement', value: 445, coordinates: [48.8839, 2.3789] },
  { id: '75020', name: '20e arrondissement', value: 389, coordinates: [48.8631, 2.3969] }
];

// Statistiques de participation par mois
export const mockParticipationStats: TimeSeriesData[] = [
  { date: '2024-01', value: 1240, category: 'Participants uniques' },
  { date: '2024-02', value: 1380, category: 'Participants uniques' },
  { date: '2024-03', value: 1520, category: 'Participants uniques' },
  { date: '2024-04', value: 1890, category: 'Participants uniques' },
  { date: '2024-05', value: 2150, category: 'Participants uniques' },
  { date: '2024-06', value: 2380, category: 'Participants uniques' },
  { date: '2024-07', value: 2100, category: 'Participants uniques' },

  { date: '2024-01', value: 89, category: 'Projets actifs' },
  { date: '2024-02', value: 92, category: 'Projets actifs' },
  { date: '2024-03', value: 98, category: 'Projets actifs' },
  { date: '2024-04', value: 105, category: 'Projets actifs' },
  { date: '2024-05', value: 112, category: 'Projets actifs' },
  { date: '2024-06', value: 118, category: 'Projets actifs' },
  { date: '2024-07', value: 124, category: 'Projets actifs' },

  { date: '2024-01', value: 1450, category: 'Commentaires' },
  { date: '2024-02', value: 1680, category: 'Commentaires' },
  { date: '2024-03', value: 1920, category: 'Commentaires' },
  { date: '2024-04', value: 2340, category: 'Commentaires' },
  { date: '2024-05', value: 2890, category: 'Commentaires' },
  { date: '2024-06', value: 3240, category: 'Commentaires' },
  { date: '2024-07', value: 2980, category: 'Commentaires' }
];

// Données de satisfaction par catégorie
export const mockSatisfactionData: ChartDataPoint[] = [
  { name: 'Très satisfait', value: 342, category: 'satisfaction', color: '#4caf50' },
  { name: 'Satisfait', value: 1234, category: 'satisfaction', color: '#8bc34a' },
  { name: 'Neutre', value: 456, category: 'satisfaction', color: '#ffc107' },
  { name: 'Insatisfait', value: 234, category: 'satisfaction', color: '#ff9800' },
  { name: 'Très insatisfait', value: 89, category: 'satisfaction', color: '#f44336' }
];

// Données démographiques des participants
export const mockDemographicsData: ChartDataPoint[] = [
  { name: '18-25 ans', value: 456, category: 'age', color: '#9c27b0' },
  { name: '26-35 ans', value: 892, category: 'age', color: '#673ab7' },
  { name: '36-50 ans', value: 1234, category: 'age', color: '#3f51b5' },
  { name: '51-65 ans', value: 678, category: 'age', color: '#2196f3' },
  { name: '65+ ans', value: 234, category: 'age', color: '#03a9f4' }
];

// Statistiques générales
export const mockGeneralStats: StatisticsData = {
  total: 15678,
  change: 12.5,
  changeType: 'increase',
  period: 'ce mois',
  breakdown: [
    { name: 'Nouveaux participants', value: 1456, percentage: 9.3 },
    { name: 'Projets créés', value: 23, percentage: 15.2 },
    { name: 'Commentaires ajoutés', value: 892, percentage: 8.7 }
  ]
};

// Fonction pour générer des données aléatoires
export const generateRandomData = (count: number = 12): ChartDataPoint[] => {
  const categories = ['Budget', 'Transport', 'Éducation', 'Santé', 'Environnement', 'Culture'];
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#455a64'];
  
  return Array.from({ length: count }, (_, i) => ({
    name: categories[i % categories.length] + ` ${Math.floor(i / categories.length) + 1}`,
    value: Math.floor(Math.random() * 1000) + 100,
    category: categories[i % categories.length],
    color: colors[i % colors.length]
  }));
};

// Fonction pour générer des données temporelles
export const generateTimeSeriesData = (months: number = 12, categories: string[] = ['Total']): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    const dateStr = date.toISOString().slice(0, 7); // Format YYYY-MM

    categories.forEach(category => {
      data.push({
        date: dateStr,
        value: Math.floor(Math.random() * 1000) + 500,
        category
      });
    });
  }

  return data;
}; 