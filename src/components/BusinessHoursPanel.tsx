import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import type { BusinessHour, Schedule, WeekDays, EditorNode } from '../types/flow';

interface BusinessHoursPanelProps {
  businessHours: BusinessHour[];
  onUpdateBusinessHours: (businessHours: BusinessHour[]) => void;
  availableStates: EditorNode[];
}

export const BusinessHoursPanel: React.FC<BusinessHoursPanelProps> = ({
  businessHours,
  onUpdateBusinessHours,
  availableStates,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingBusinessHour, setEditingBusinessHour] = useState<BusinessHour | null>(null);
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number>(-1);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    key: '',
    fallbackStateKey: '',
    schedules: [] as Schedule[],
  });

  const [scheduleFormData, setScheduleFormData] = useState<Schedule>({
    startTime: '09:00',
    endTime: '17:00',
    dateFrom: '2024-01-01T00:00:00-06:00',
    dateThrough: '2100-12-31T23:59:59-06:00',
    weekDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    }
  });

  const weekDayLabels = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const handleOpenAdd = () => {
    setFormData({
      key: '',
      fallbackStateKey: '',
      schedules: [],
    });
    setEditingBusinessHour(null);
    setIsEditing(false);
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (businessHour: BusinessHour) => {
    setFormData({
      key: businessHour.key,
      fallbackStateKey: businessHour.fallbackStateKey,
      schedules: [...businessHour.schedules],
    });
    setEditingBusinessHour(businessHour);
    setIsEditing(true);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingBusinessHour(null);
    setIsEditing(false);
    setFormData({
      key: '',
      fallbackStateKey: '',
      schedules: [],
    });
  };

  const handleOpenScheduleDialog = (scheduleIndex: number = -1) => {
    if (scheduleIndex >= 0) {
      // Edit existing schedule
      setScheduleFormData({ ...formData.schedules[scheduleIndex] });
      setEditingScheduleIndex(scheduleIndex);
    } else {
      // Add new schedule
      setScheduleFormData({
        startTime: '09:00',
        endTime: '17:00',
        dateFrom: '2024-01-01T00:00:00-06:00',
        dateThrough: '2100-12-31T23:59:59-06:00',
        weekDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        }
      });
      setEditingScheduleIndex(-1);
    }
    setScheduleDialogOpen(true);
  };

  const handleCloseScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setEditingScheduleIndex(-1);
  };

  const handleSaveSchedule = () => {
    const updatedSchedules = [...formData.schedules];
    
    if (editingScheduleIndex >= 0) {
      // Edit existing
      updatedSchedules[editingScheduleIndex] = scheduleFormData;
    } else {
      // Add new
      updatedSchedules.push(scheduleFormData);
    }
    
    setFormData({
      ...formData,
      schedules: updatedSchedules,
    });
    
    handleCloseScheduleDialog();
  };

  const handleDeleteSchedule = (index: number) => {
    if (confirm('¿Eliminar este horario?')) {
      const updatedSchedules = formData.schedules.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        schedules: updatedSchedules,
      });
    }
  };

  const handleSave = () => {
    if (!formData.key.trim()) {
      alert('El key es requerido');
      return;
    }

    if (!formData.fallbackStateKey.trim()) {
      alert('El fallback state es requerido');
      return;
    }

    if (formData.schedules.length === 0) {
      alert('Debe agregar al menos un horario');
      return;
    }

    const newBusinessHour: BusinessHour = {
      key: formData.key.trim(),
      fallbackStateKey: formData.fallbackStateKey,
      schedules: formData.schedules,
    };

    if (isEditing && editingBusinessHour) {
      // Edit existing
      const updatedBusinessHours = businessHours.map(bh => 
        bh.key === editingBusinessHour.key ? newBusinessHour : bh
      );
      onUpdateBusinessHours(updatedBusinessHours);
    } else {
      // Add new
      if (businessHours.some(bh => bh.key === newBusinessHour.key)) {
        alert('Ya existe un Business Hour con ese key');
        return;
      }
      onUpdateBusinessHours([...businessHours, newBusinessHour]);
    }

    handleCloseDialog();
  };

  const handleDelete = (businessHour: BusinessHour) => {
    if (confirm(`¿Eliminar el Business Hour "${businessHour.key}"?`)) {
      onUpdateBusinessHours(businessHours.filter(bh => bh.key !== businessHour.key));
    }
  };

  const formatDateRange = (schedule: Schedule) => {
    const startDate = new Date(schedule.dateFrom).toLocaleDateString();
    const endDate = new Date(schedule.dateThrough).toLocaleDateString();
    return `${startDate} - ${endDate}`;
  };

  const getActiveDays = (weekDays: WeekDays) => {
    return Object.entries(weekDays)
      .filter(([, active]) => active)
      .map(([day]) => weekDayLabels[day as keyof WeekDays])
      .join(', ');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <CalendarMonthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Business Hours
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={handleOpenAdd}
            size="small"
          >
            Agregar
          </Button>
        </Box>
        
        {businessHours.length === 0 && (
          <Alert severity="info" sx={{ mt: 1 }}>
            No hay horarios de negocio definidos
          </Alert>
        )}
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        maxHeight: 'calc(100vh - 300px)',
        p: 1
      }}>
        <List>
          {businessHours.map((businessHour) => (
            <ListItem key={businessHour.key} sx={{ mb: 1, display: 'block' }}>
              <Card sx={{ width: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" color="primary">
                      {businessHour.key}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenEdit(businessHour)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(businessHour)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Fallback State:</strong> {businessHour.fallbackStateKey}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Horarios ({businessHour.schedules.length})
                  </Typography>

                  {businessHour.schedules.map((schedule, index) => (
                    <Box key={index} sx={{ ml: 2, mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        <strong>{schedule.startTime} - {schedule.endTime}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {formatDateRange(schedule)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {getActiveDays(schedule.weekDays)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Business Hour Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {isEditing ? 'Editar Business Hour' : 'Nuevo Business Hour'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            fullWidth
            label="Key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            margin="normal"
            disabled={isEditing}
          />

          <Autocomplete
            fullWidth
            options={availableStates}
            getOptionLabel={(option) => `${option.data.key} - ${option.data.label || 'Sin label'}`}
            value={availableStates.find(state => state.data.key === formData.fallbackStateKey) || null}
            onChange={(_, newValue) => setFormData({
              ...formData,
              fallbackStateKey: newValue?.data.key || ''
            })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Fallback State"
                margin="normal"
                helperText="Step al que se redirige cuando está fuera del horario"
              />
            )}
          />

          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">
              Horarios ({formData.schedules.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={() => handleOpenScheduleDialog()}
              size="small"
            >
              Agregar Horario
            </Button>
          </Box>

          {formData.schedules.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Debe agregar al menos un horario
            </Alert>
          )}

          {formData.schedules.map((schedule, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Horario {index + 1}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenScheduleDialog(index)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteSchedule(index)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body2">
                  <strong>{schedule.startTime} - {schedule.endTime}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {formatDateRange(schedule)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getActiveDays(schedule.weekDays)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.key.trim() || !formData.fallbackStateKey.trim()}
          >
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Edit/Add Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={handleCloseScheduleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {editingScheduleIndex >= 0 ? 'Editar Horario' : 'Nuevo Horario'}
            </Typography>
            <IconButton onClick={handleCloseScheduleDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Hora Inicio"
              type="time"
              value={scheduleFormData.startTime}
              onChange={(e) => setScheduleFormData({ 
                ...scheduleFormData, 
                startTime: e.target.value 
              })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Hora Fin"
              type="time"
              value={scheduleFormData.endTime}
              onChange={(e) => setScheduleFormData({ 
                ...scheduleFormData, 
                endTime: e.target.value 
              })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Fecha Desde"
              type="datetime-local"
              value={scheduleFormData.dateFrom.slice(0, 16)}
              onChange={(e) => setScheduleFormData({ 
                ...scheduleFormData, 
                dateFrom: e.target.value + ':00-06:00'
              })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Fecha Hasta"
              type="datetime-local"
              value={scheduleFormData.dateThrough.slice(0, 16)}
              onChange={(e) => setScheduleFormData({ 
                ...scheduleFormData, 
                dateThrough: e.target.value + ':00-06:00'
              })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Días de la Semana
          </Typography>
          
          <FormGroup>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {Object.entries(weekDayLabels).map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={scheduleFormData.weekDays[key as keyof WeekDays]}
                      onChange={(e) => setScheduleFormData({
                        ...scheduleFormData,
                        weekDays: {
                          ...scheduleFormData.weekDays,
                          [key]: e.target.checked
                        }
                      })}
                    />
                  }
                  label={label}
                />
              ))}
            </Box>
          </FormGroup>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseScheduleDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveSchedule} 
            variant="contained"
          >
            {editingScheduleIndex >= 0 ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};