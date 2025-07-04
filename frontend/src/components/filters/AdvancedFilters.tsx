import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Badge
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  DateRange as DateIcon,
  Category as CategoryIcon,
  TuneRounded as TuneIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { FilterOptions } from '../../types/visualization';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  availableCategories?: string[];
  availableRegions?: string[];
  availableStatuses?: string[];
  defaultFilters?: FilterOptions;
  compact?: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  onFiltersChange,
  availableCategories = [
    'Éducation', 'Transport', 'Logement', 'Santé', 
    'Environnement', 'Culture et Sports', 'Sécurité', 'Économie'
  ],
  availableRegions = [
    '1er arr.', '2e arr.', '3e arr.', '4e arr.', '5e arr.',
    '6e arr.', '7e arr.', '8e arr.', '9e arr.', '10e arr.',
    '11e arr.', '12e arr.', '13e arr.', '14e arr.', '15e arr.',
    '16e arr.', '17e arr.', '18e arr.', '19e arr.', '20e arr.'
  ],
  availableStatuses = [
    'En préparation', 'En cours', 'En consultation', 
    'Terminé', 'Suspendu', 'Annulé'
  ],
  defaultFilters,
  compact = false
}) => {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [participationRange, setParticipationRange] = useState<number[]>([0, 1000]);

  // Compter le nombre de filtres actifs
  const activeFiltersCount = 
    (filters.categories?.length || 0) +
    (filters.regions?.length || 0) +
    (filters.status?.length || 0) +
    (filters.dateRange ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {};
    setFilters(emptyFilters);
    setSearchTerm('');
    setParticipationRange([0, 1000]);
    onFiltersChange(emptyFilters);
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    handleFilterChange({ categories: newCategories });
  };

  const handleRegionToggle = (region: string) => {
    const currentRegions = filters.regions || [];
    const newRegions = currentRegions.includes(region)
      ? currentRegions.filter(r => r !== region)
      : [...currentRegions, region];
    
    handleFilterChange({ regions: newRegions });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    handleFilterChange({ status: newStatuses });
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    if (start && end) {
      handleFilterChange({
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        }
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      handleFilterChange(newFilters);
    }
  };

  // Version compacte pour mobile
  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ flexGrow: 1 }}
            />
            <IconButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              color={activeFiltersCount > 0 ? 'primary' : 'default'}
            >
              <Badge badgeContent={activeFiltersCount} color="error">
                <TuneIcon />
              </Badge>
            </IconButton>
          </Box>

          {showAdvanced && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Catégories</InputLabel>
                <Select
                  multiple
                  value={filters.categories || []}
                  label="Catégories"
                  renderValue={(selected) => `${selected.length} sélectionnées`}
                >
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                size="small"
                onClick={handleClearFilters}
                disabled={activeFiltersCount === 0}
                startIcon={<ClearIcon />}
              >
                Effacer
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Version complète pour desktop
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6">
              Filtres de données
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip 
                label={`${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`}
                size="small" 
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          <Button
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
            startIcon={<ClearIcon />}
            variant="outlined"
            size="small"
          >
            Tout effacer
          </Button>
        </Box>

        {/* Recherche textuelle */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Rechercher dans les projets, commentaires, datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Période */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateIcon color="primary" />
              <Typography variant="subtitle1">Période</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <DatePicker
                  label="Date de début"
                  value={filters.dateRange?.start ? new Date(filters.dateRange.start) : null}
                  onChange={(date) => handleDateRangeChange(
                    date, 
                    filters.dateRange?.end ? new Date(filters.dateRange.end) : null
                  )}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Typography variant="body2" color="text.secondary">à</Typography>
                <DatePicker
                  label="Date de fin"
                  value={filters.dateRange?.end ? new Date(filters.dateRange.end) : null}
                  onChange={(date) => handleDateRangeChange(
                    filters.dateRange?.start ? new Date(filters.dateRange.start) : null,
                    date
                  )}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </Box>
            </LocalizationProvider>
          </AccordionDetails>
        </Accordion>

        {/* Catégories */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon color="primary" />
              <Typography variant="subtitle1">Catégories</Typography>
              {filters.categories && filters.categories.length > 0 && (
                <Chip 
                  label={filters.categories.length} 
                  size="small" 
                  color="primary"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableCategories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => handleCategoryToggle(category)}
                  color={filters.categories?.includes(category) ? 'primary' : 'default'}
                  variant={filters.categories?.includes(category) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Arrondissements */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">🗺️ Arrondissements</Typography>
              {filters.regions && filters.regions.length > 0 && (
                <Chip 
                  label={filters.regions.length} 
                  size="small" 
                  color="secondary"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1 }}>
              {availableRegions.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  onClick={() => handleRegionToggle(region)}
                  color={filters.regions?.includes(region) ? 'secondary' : 'default'}
                  variant={filters.regions?.includes(region) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Statuts */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">📊 Statuts</Typography>
              {filters.status && filters.status.length > 0 && (
                <Chip 
                  label={filters.status.length} 
                  size="small" 
                  color="success"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableStatuses.map((status) => (
                <Chip
                  key={status}
                  label={status}
                  onClick={() => handleStatusToggle(status)}
                  color={filters.status?.includes(status) ? 'success' : 'default'}
                  variant={filters.status?.includes(status) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Niveau de participation */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">👥 Niveau de participation</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Filtrer par nombre de participants (min - max)
              </Typography>
              <Slider
                value={participationRange}
                onChange={(_, newValue) => setParticipationRange(newValue as number[])}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
                marks={[
                  { value: 0, label: '0' },
                  { value: 250, label: '250' },
                  { value: 500, label: '500' },
                  { value: 750, label: '750' },
                  { value: 1000, label: '1000+' }
                ]}
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters; 