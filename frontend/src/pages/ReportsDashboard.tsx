import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Settings, Plus, Clock, CheckCircle, AlertCircle, Filter, Search } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  sections: string[];
  charts_included: string[];
  default_params: any;
}

interface ReportHistory {
  id: string;
  title: string;
  template_id: string;
  template_name: string;
  period_start: string;
  period_end: string;
  file_name: string;
  file_size: number;
  generated_at: string;
  download_url: string;
  user_id: string;
  user_name: string;
  status: string;
}

const ReportsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  
  // État pour le formulaire de génération
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    period_start: '',
    period_end: '',
    sections: [] as string[],
    include_charts: [] as string[]
  });

  // Filtres
  const [templateFilter, setTemplateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const templateTypeLabels = {
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    annual: 'Annuel',
    custom: 'Personnalisé'
  };

  const templateTypeColors = {
    monthly: 'bg-blue-100 text-blue-800',
    quarterly: 'bg-green-100 text-green-800',
    annual: 'bg-purple-100 text-purple-800',
    custom: 'bg-orange-100 text-orange-800'
  };

  const statusColors = {
    completed: 'text-green-600',
    generating: 'text-yellow-600',
    error: 'text-red-600'
  };

  const statusIcons = {
    completed: CheckCircle,
    generating: Clock,
    error: AlertCircle
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesData, reportsData] = await Promise.all([
        apiService.getReportTemplates(),
        apiService.getReportsHistory({ limit: 50 })
      ]);
      setTemplates(templatesData);
      setReports(reportsData);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur lors du chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !formData.title || !formData.period_start || !formData.period_end) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setGenerating(selectedTemplate.id);
      
      const reportRequest = {
        template_id: selectedTemplate.id,
        title: formData.title,
        period_start: new Date(formData.period_start + 'T00:00:00').toISOString(),
        period_end: new Date(formData.period_end + 'T23:59:59').toISOString(),
        sections: formData.sections.length > 0 ? formData.sections : selectedTemplate.sections,
        include_charts: formData.include_charts.length > 0 ? formData.include_charts : selectedTemplate.charts_included
      };

      const newReport = await apiService.generateReport(reportRequest);
      
      // Ajouter le nouveau rapport en haut de la liste
      setReports(prev => [newReport, ...prev]);
      
      // Réinitialiser le formulaire
      setShowGenerateForm(false);
      setSelectedTemplate(null);
      setFormData({
        title: '',
        period_start: '',
        period_end: '',
        sections: [],
        include_charts: []
      });
      
      alert('Rapport généré avec succès !');
    } catch (err) {
      setError('Erreur lors de la génération du rapport');
      console.error('Erreur génération:', err);
    } finally {
      setGenerating(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openGenerateForm = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: `${template.name} - ${new Date().toLocaleDateString('fr-FR')}`,
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      period_end: new Date().toISOString().split('T')[0],
      sections: [],
      include_charts: []
    });
    setShowGenerateForm(true);
  };

  const filteredReports = reports.filter(report => {
    const matchesTemplate = !templateFilter || report.template_id === templateFilter;
    const matchesSearch = !searchTerm || report.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTemplate && matchesSearch;
  });

  const handleDownload = async (report: any) => {
    try {
      const blob = await apiService.downloadReport(report.file_name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      setError('Erreur lors du téléchargement du fichier');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Dashboard Reports
              </h1>
              <p className="text-gray-600 mt-2">
                Générez des rapports PDF professionnels à partir de vos données Analytics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rapports générés</p>
                <p className="text-3xl font-bold text-green-600">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taille totale</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatFileSize(reports.reduce((sum, report) => sum + report.file_size, 0))}
                </p>
              </div>
              <Download className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ce mois</p>
                <p className="text-3xl font-bold text-orange-600">
                  {reports.filter(r => new Date(r.generated_at).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates disponibles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates disponibles</h2>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${templateTypeColors[template.template_type as keyof typeof templateTypeColors] || 'bg-gray-100 text-gray-800'}`}>
                        {templateTypeLabels[template.template_type as keyof typeof templateTypeLabels] || template.template_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{template.sections.length} sections</span>
                      <button
                        onClick={() => openGenerateForm(template)}
                        disabled={generating === template.id}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {generating === template.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Génération...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            Générer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Historique des rapports */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Historique des rapports</h2>
                
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  
                  <select
                    value={templateFilter}
                    onChange={(e) => setTemplateFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Tous les types</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun rapport trouvé</h3>
                    <p className="mt-2 text-gray-500">
                      {searchTerm || templateFilter 
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Commencez par générer votre premier rapport'
                      }
                    </p>
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    const StatusIcon = statusIcons[report.status as keyof typeof statusIcons] || CheckCircle;
                    return (
                      <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon className={`h-4 w-4 ${statusColors[report.status as keyof typeof statusColors] || 'text-gray-500'}`} />
                              <h3 className="font-medium text-gray-900 truncate">{report.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{report.template_name}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Généré le {formatDate(report.generated_at)}</span>
                              <span>{formatFileSize(report.file_size)}</span>
                              <span>
                                {new Date(report.period_start).toLocaleDateString('fr-FR')} - {new Date(report.period_end).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {report.status === 'completed' && (
                              <button
                                onClick={() => handleDownload(report)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Télécharger
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de génération */}
      {showGenerateForm && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Générer un rapport: {selectedTemplate.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du rapport *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Titre du rapport"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Début période *
                  </label>
                  <input
                    type="date"
                    value={formData.period_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fin période *
                  </label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sections incluses
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedTemplate.sections.map(section => (
                    <label key={section} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.sections.length === 0 || formData.sections.includes(section)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ 
                              ...prev, 
                              sections: prev.sections.length === 0 ? selectedTemplate.sections : [...prev.sections, section]
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              sections: prev.sections.filter(s => s !== section)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{section.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowGenerateForm(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={!formData.title || !formData.period_start || !formData.period_end}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Générer le rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard; 