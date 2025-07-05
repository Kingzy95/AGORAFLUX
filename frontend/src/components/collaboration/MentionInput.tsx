import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Chip,
  Typography,
  TextFieldProps
} from '@mui/material';
import { MentionSuggestion, Mention } from '../../types/collaboration';

interface MentionInputProps extends Omit<TextFieldProps, 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (value: string, mentions?: Mention[]) => void;
  onSubmit?: () => void;
  availableUsers: MentionSuggestion[];
  placeholder?: string;
  endAdornment?: React.ReactNode;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSubmit,
  availableUsers,
  placeholder = "Tapez @ pour mentionner un utilisateur...",
  endAdornment,
  ...textFieldProps
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filtrer les suggestions basées sur le texte après @
  const filteredSuggestions = availableUsers.filter(user =>
    user.name.toLowerCase().includes(suggestionFilter.toLowerCase())
  ).slice(0, 5); // Limiter à 5 suggestions

  // Détecter les mentions dans le texte
  const detectMentions = (text: string): Mention[] => {
    const mentionRegex = /@(\w+)/g;
    const detectedMentions: Mention[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[1];
      const user = availableUsers.find(u => 
        u.name.toLowerCase().replace(/\s+/g, '') === mentionText.toLowerCase()
      );
      
      if (user) {
        detectedMentions.push({
          id: `mention-${user.id}-${match.index}`,
          userId: user.id,
          userName: user.name,
          position: {
            start: match.index,
            end: match.index + match[0].length
          }
        });
      }
    }

    return detectedMentions;
  };

  // Gérer les changements de texte
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    const newCursorPosition = event.target.selectionStart || 0;
    
    setCursorPosition(newCursorPosition);

    // Vérifier si on est en train de taper une mention
    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Si le texte après @ ne contient pas d'espace, on est en train de taper une mention
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setSuggestionFilter(textAfterAt);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

    // Détecter toutes les mentions dans le texte
    const newMentions = detectMentions(newValue);
    setMentions(newMentions);
    
    onChange(newValue, newMentions);
  };

  // Gérer la sélection d'une suggestion
  const handleSuggestionSelect = (user: MentionSuggestion) => {
    if (!inputRef.current) return;

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = value.substring(0, lastAtIndex);
      const mentionText = `@${user.name.replace(/\s+/g, '')} `;
      const newValue = beforeAt + mentionText + textAfterCursor;
      const newCursorPosition = lastAtIndex + mentionText.length;
      
      // Mettre à jour le texte et la position du curseur
      onChange(newValue, detectMentions(newValue));
      setShowSuggestions(false);
      
      // Replacer le curseur après la mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  // Gérer les touches du clavier
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredSuggestions[selectedSuggestionIndex]) {
            handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    } else if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  // Fermer les suggestions si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rendre le texte avec les mentions mises en évidence
  const renderTextWithMentions = () => {
    if (!mentions.length) return null;

    const parts = [];
    let lastIndex = 0;

    mentions.forEach((mention, index) => {
      // Texte avant la mention
      if (mention.position.start > lastIndex) {
        parts.push(value.substring(lastIndex, mention.position.start));
      }
      
      // La mention elle-même
      parts.push(
        <Chip
          key={`mention-${index}`}
          label={mention.userName}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mx: 0.25, fontSize: '0.75rem', height: 20 }}
        />
      );
      
      lastIndex = mention.position.end;
    });

    // Texte après la dernière mention
    if (lastIndex < value.length) {
      parts.push(value.substring(lastIndex));
    }

    return (
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        pointerEvents: 'none',
        padding: '8px 14px',
        color: 'transparent',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        zIndex: 1
      }}>
        {parts}
      </Box>
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...textFieldProps}
        ref={inputRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        InputProps={{
          ...textFieldProps.InputProps,
          endAdornment,
          sx: {
            position: 'relative',
            ...textFieldProps.InputProps?.sx
          }
        }}
        sx={{
          width: '100%',
          ...textFieldProps.sx
        }}
      />

      {/* Overlay pour les mentions visuelles */}
      {mentions.length > 0 && renderTextWithMentions()}

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <Paper
          ref={suggestionsRef}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto',
            mt: 0.5,
            boxShadow: 3
          }}
        >
          <List sx={{ py: 0 }}>
            {filteredSuggestions.map((user, index) => (
              <ListItem key={user.id} disablePadding>
                <ListItemButton
                  selected={index === selectedSuggestionIndex}
                  onClick={() => handleSuggestionSelect(user)}
                  sx={{
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '14px' }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={user.role}
                        size="small"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                      {user.isOnline && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'success.main'
                          }}
                        />
                      )}
                    </Box>
                  }
                                  />
                </ListItemButton>
              </ListItem>
              ))}
            </List>
        </Paper>
      )}

      {/* Aide contextuelle */}
      {value === '' && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            position: 'absolute',
            bottom: -20,
            left: 0,
            fontSize: '0.7rem'
          }}
        >
          Tapez @ pour mentionner un utilisateur
        </Typography>
      )}
    </Box>
  );
};

export default MentionInput; 