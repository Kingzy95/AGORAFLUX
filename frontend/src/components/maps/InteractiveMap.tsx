import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker } from 'react-leaflet';
import { Box, Typography, Card, Alert } from '@mui/material';
import { MapProps } from '../../types/visualization';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction du problème des icônes par défaut de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const InteractiveMap: React.FC<MapProps> = ({
  data,
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 11,
  height = 500,
  onMarkerClick,
  showClusters = false
}) => {
  // Calcul des valeurs min/max pour la normalisation des cercles
  const { minValue, maxValue } = useMemo(() => {
    if (!data || data.length === 0) return { minValue: 0, maxValue: 100 };
    
    const values = data.map(d => d.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values)
    };
  }, [data]);

  // Fonction pour calculer la taille du cercle
  const getCircleRadius = (value: number): number => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    return Math.max(8, normalizedValue * 30 + 5); // Entre 8 et 35 pixels
  };

  // Fonction pour calculer la couleur en fonction de la valeur
  const getCircleColor = (value: number): string => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    
    // Gradient de bleu foncé à rouge
    if (normalizedValue < 0.33) {
      return '#1976d2'; // Bleu
    } else if (normalizedValue < 0.66) {
      return '#f57c00'; // Orange
    } else {
      return '#d32f2f'; // Rouge
    }
  };

  // Formatage des valeurs pour l'affichage
  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  if (!data || data.length === 0) {
    return (
      <Card sx={{ p: 3, height }}>
        <Alert severity="info">Aucune donnée géographique à afficher</Alert>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3, height: height + 60 }}>
      <Typography variant="h6" gutterBottom>
        Carte de participation par arrondissement
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Taille et couleur des cercles proportionnelles au nombre de participants
      </Typography>
      
      <Box sx={{ height, position: 'relative', borderRadius: 1, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {data.map((location) => (
            <CircleMarker
              key={location.id}
              center={location.coordinates}
              radius={getCircleRadius(location.value)}
              pathOptions={{
                fillColor: getCircleColor(location.value),
                color: getCircleColor(location.value),
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.6
              }}
              eventHandlers={{
                click: () => onMarkerClick?.(location)
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {location.name}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    <strong>{formatValue(location.value)} participants</strong>
                  </Typography>
                  {location.properties && (
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(location.properties).map(([key, value]) => (
                        <Typography key={key} variant="caption" display="block">
                          {key}: {value}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>

      {/* Légende */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Participation:
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#1976d2'
            }}
          />
          <Typography variant="caption">
            Faible ({formatValue(minValue)})
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#f57c00'
            }}
          />
          <Typography variant="caption">
            Moyenne
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#d32f2f'
            }}
          />
          <Typography variant="caption">
            Élevée ({formatValue(maxValue)})
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default InteractiveMap; 