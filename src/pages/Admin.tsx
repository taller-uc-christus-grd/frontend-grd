import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import type { Role } from '@/types';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  toggleUserStatus,
  type User,
  type CreateUserData 
} from '@/services/users';
import { getConfig, updateConfig, type SystemConfig } from '@/services/config';
import { getLogs, type SystemLog } from '@/services/logs';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'config' | 'logs'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Estado de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado de configuración del sistema
  const [config, setConfig] = useState<SystemConfig>({
    maxFileSizeMB: 10,
    sessionTimeout: 480,
    maxLoginAttempts: 3,
    passwordMinLength: 8
  });

  const [configChanged, setConfigChanged] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

  // Estado de logs del sistema
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  // Función para cargar configuración desde el backend
  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const configData = await getConfig();
      setConfig({
        maxFileSizeMB: configData.maxFileSizeMB || 10,
        sessionTimeout: configData.sessionTimeout || 480,
        maxLoginAttempts: configData.maxLoginAttempts || 3,
        passwordMinLength: configData.passwordMinLength || 8
      });
      setConfigChanged(false);
    } catch (error: any) {
      console.error('Error al cargar configuración:', error);
      setFeedback({ type: 'error', message: error.message || 'Error al cargar configuración' });
    } finally {
      setConfigLoading(false);
    }
  };

  // Función para cargar logs desde el backend
  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await getLogs({ 
        level: logFilter !== 'all' ? logFilter : undefined,
        limit: 100 
      });
      setLogs(response.logs);
    } catch (error: any) {
      console.error('Error al cargar logs:', error);
      setFeedback({ type: 'error', message: error.message || 'Error al cargar logs' });
    } finally {
      setLogsLoading(false);
    }
  };

  // Cargar configuración, logs y usuarios al montar el componente
  useEffect(() => {
    loadUsers();
    if (activeTab === 'config') {
      loadConfig();
    }
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, []);

  // Cargar configuración/logs cuando cambie la pestaña activa
  useEffect(() => {
    if (activeTab === 'config') {
      loadConfig();
    }
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  // Función para cargar usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error al cargar usuarios:', error);
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'codificador' as Role,
    status: 'active' as 'active' | 'inactive'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funciones para configuración
  const handleConfigChange = (key: keyof SystemConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setConfigChanged(true);
  };

  const handleSaveConfig = async () => {
    try {
      setConfigLoading(true);
      await updateConfig(config);
      setConfigChanged(false);
      setFeedback({ type: 'success', message: 'Configuración guardada correctamente' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error('Error al guardar configuración:', error);
      setFeedback({ type: 'error', message: error.message || 'Error al guardar configuración' });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleResetConfig = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      const defaultConfig: SystemConfig = {
        maxFileSizeMB: 10,
        sessionTimeout: 480,
        maxLoginAttempts: 3,
        passwordMinLength: 8
      };
      setConfig(defaultConfig);
      setConfigChanged(true);
    }
  };

  // Funciones para logs
  const getLogTypeColor = (type: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getLogTypeIcon = (type: string) => {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type as keyof typeof icons] || '•';
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = logFilter === 'all' || log.type === logFilter;
    const matchesSearch = logSearch === '' || 
      log.user.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Recargar logs cuando cambie el filtro (solo si estamos en la pestaña de logs)
  useEffect(() => {
    if (activeTab === 'logs' && logFilter) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logFilter]);

  const handleExportLogs = () => {
    const csvContent = [
      ['Usuario', 'Acción', 'Timestamp', 'Tipo', 'IP', 'Detalles'],
      ...filteredLogs.map(log => [
        log.user,
        log.action,
        log.timestamp,
        log.type,
        log.ip,
        log.details
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_grd_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setFeedback({ type: 'success', message: 'Logs exportados correctamente' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Editar usuario existente
        await updateUser({
          id: editingUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status
        });
        setFeedback({ type: 'success', message: 'Usuario actualizado correctamente' });
      } else {
        // Crear nuevo usuario
        if (!formData.password) {
          setFeedback({ type: 'error', message: 'La contraseña es obligatoria para crear un nuevo usuario' });
          return;
        }
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        });
        setFeedback({ type: 'success', message: 'Usuario creado correctamente' });
      }

      // Recargar usuarios desde el backend
      await loadUsers();

      setShowUserForm(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'codificador', status: 'active' });
      
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      setFeedback({ type: 'error', message: error.message });
    }
    
    // Limpiar feedback después de 5 segundos
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // No mostrar contraseña al editar por seguridad
      role: user.role,
      status: user.status
    });
    setShowUserForm(true);
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await toggleUserStatus(userId, newStatus);
      
      // Recargar usuarios desde el backend
      await loadUsers();
      
      setFeedback({ type: 'success', message: 'Estado del usuario actualizado' });
    } catch (error: any) {
      console.error('Error al cambiar estado del usuario:', error);
      setFeedback({ type: 'error', message: error.message });
    }
    
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteUser(userId);
        
        // Recargar usuarios desde el backend
        await loadUsers();
        
        setFeedback({ type: 'success', message: 'Usuario eliminado correctamente' });
      } catch (error: any) {
        console.error('Error al eliminar usuario:', error);
        setFeedback({ type: 'error', message: error.message });
      }
      
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const getRoleColor = (role: Role) => {
    const colors = {
      codificador: 'bg-blue-100 text-blue-800',
      finanzas: 'bg-green-100 text-green-800',
      gestion: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[role];
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div>
            <h1 className="text-3xl font-open-sauce font-light bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Administrador del Sistema
            </h1>
            <p className="text-slate-600 mt-2">
              Bienvenido, {user?.email} • Rol: Administrador
            </p>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-lg ${
            feedback.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'users', label: 'Gestión de Usuarios', icon: '👥' },
                { id: 'config', label: 'Configuración', icon: '⚙️' },
                { id: 'logs', label: 'Logs y Monitoreo', icon: '📊' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && (
              <div>
                {/* Header de gestión de usuarios */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Usuarios del Sistema</h2>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setFormData({ name: '', email: '', password: '', role: 'codificador', status: 'active' });
                      setShowUserForm(true);
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    + Nuevo Usuario
                  </button>
                </div>

                {/* Tabla de usuarios */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando usuarios...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Último Acceso
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{user.name}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                              {user.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.lastLogin || 'Nunca'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className={`${
                                user.status === 'active' 
                                  ? 'text-orange-600 hover:text-orange-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.status === 'active' ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'config' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Configuración del Sistema</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleResetConfig}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Restaurar por Defecto
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      disabled={!configChanged || configLoading}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        configChanged && !configLoading
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {configLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>

                {configLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando configuración...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Tamaño Máximo de Archivos */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </span>
                        Tamaño Máximo de Archivos
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tamaño Máximo de Archivo: {config.maxFileSizeMB || 10} MB
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={config.maxFileSizeMB || 10}
                            onChange={(e) => handleConfigChange('maxFileSizeMB', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1 MB</span>
                            <span>100 MB</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seguridad */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                        Seguridad
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Timeout de Sesión: {config.sessionTimeout || 480} minutos
                          </label>
                          <input
                            type="range"
                            min="30"
                            max="1440"
                            value={config.sessionTimeout || 480}
                            onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>30 min</span>
                            <span>24 horas</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Intentos Máximos de Login: {config.maxLoginAttempts || 3}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={config.maxLoginAttempts || 3}
                            onChange={(e) => handleConfigChange('maxLoginAttempts', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1</span>
                            <span>10</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Longitud Mínima de Contraseña: {config.passwordMinLength || 8} caracteres
                          </label>
                          <input
                            type="range"
                            min="6"
                            max="20"
                            value={config.passwordMinLength || 8}
                            onChange={(e) => handleConfigChange('passwordMinLength', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>6</span>
                            <span>20</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Logs y Monitoreo del Sistema</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={loadLogs}
                      disabled={logsLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {logsLoading ? 'Cargando...' : 'Actualizar'}
                    </button>
                    <button
                      onClick={handleExportLogs}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar Logs
                    </button>
                  </div>
                </div>

                {/* Filtros y búsqueda */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Filtrar por tipo
                      </label>
                      <select
                        value={logFilter}
                        onChange={(e) => setLogFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Todos los tipos</option>
                        <option value="success">Éxito</option>
                        <option value="error">Error</option>
                        <option value="warning">Advertencia</option>
                        <option value="info">Información</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Buscar en logs
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por usuario, acción o detalles..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Éxitos</p>
                        <p className="text-lg font-bold text-green-800">
                          {logs.filter(log => log.type === 'success').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-red-600 font-bold">✗</span>
                      </div>
                      <div>
                        <p className="text-sm text-red-600 font-medium">Errores</p>
                        <p className="text-lg font-bold text-red-800">
                          {logs.filter(log => log.type === 'error').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-yellow-600 font-bold">⚠</span>
                      </div>
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Advertencias</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {logs.filter(log => log.type === 'warning').length}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">ℹ</span>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Información</p>
                        <p className="text-lg font-bold text-blue-800">
                          {logs.filter(log => log.type === 'info').length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de logs */}
                {logsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando logs...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Acción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              IP
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Detalles
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLogTypeColor(log.type)}`}>
                                  <span className="mr-1">{getLogTypeIcon(log.type)}</span>
                                  {log.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900">{log.user}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-900">{log.action}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-500">{new Date(log.timestamp).toLocaleString('es-CL')}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-500 font-mono">{log.ip}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600 max-w-xs truncate" title={log.details}>
                                  {log.details}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {filteredLogs.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-slate-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-slate-500">No se encontraron logs que coincidan con los filtros</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Paginación simple */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Mostrando {filteredLogs.length} de {logs.length} logs
                  </div>
                  <div className="text-sm text-slate-500">
                    Última actualización: {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de formulario de usuario */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!editingUser}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rol
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="codificador">Codificador GRD</option>
                    <option value="finanzas">Finanzas</option>
                    <option value="gestion">Gestión</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingUser ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      setFormData({ name: '', email: '', password: '', role: 'codificador', status: 'active' });
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
