import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import type { Role } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'config' | 'logs'>('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estado de configuración del sistema
  const [config, setConfig] = useState({
    // Validaciones automáticas
    autoValidation: true,
    strictMode: false,
    maxFileSize: 10, // MB
    allowedExtensions: ['xlsx', 'xls', 'csv'],
    
    // Rutas de respaldo
    backupPath: '/backups/grd',
    autoBackup: true,
    backupFrequency: 24, // horas
    
    // Notificaciones
    emailNotifications: true,
    slackNotifications: false,
    notificationEmail: 'admin@ucchristus.cl',
    
    // Seguridad
    sessionTimeout: 480, // minutos
    maxLoginAttempts: 3,
    passwordMinLength: 8,
    
    // Rendimiento
    cacheEnabled: true,
    cacheExpiry: 60, // minutos
    maxConcurrentUsers: 50
  });

  const [configChanged, setConfigChanged] = useState(false);

  // Estado de logs del sistema
  const [logs, setLogs] = useState([
    {
      id: '1',
      user: 'juan.perez@ucchristus.cl',
      action: 'Login exitoso',
      timestamp: '2024-01-20 14:30:25',
      type: 'success',
      ip: '192.168.1.100',
      details: 'Acceso desde navegador Chrome'
    },
    {
      id: '2',
      user: 'maria.gonzalez@ucchristus.cl',
      action: 'Carga de archivo GRD',
      timestamp: '2024-01-20 14:25:10',
      type: 'info',
      ip: '192.168.1.101',
      details: 'Archivo: episodios_enero_2024.xlsx (2.3 MB)'
    },
    {
      id: '3',
      user: 'carlos.lopez@ucchristus.cl',
      action: 'Error de validación',
      timestamp: '2024-01-20 14:20:45',
      type: 'error',
      ip: '192.168.1.102',
      details: 'Código GRD inválido en fila 15: 12345'
    },
    {
      id: '4',
      user: 'admin@ucchristus.cl',
      action: 'Configuración actualizada',
      timestamp: '2024-01-20 14:15:30',
      type: 'warning',
      ip: '192.168.1.103',
      details: 'Timeout de sesión cambiado a 480 minutos'
    },
    {
      id: '5',
      user: 'juan.perez@ucchristus.cl',
      action: 'Exportación de datos',
      timestamp: '2024-01-20 14:10:15',
      type: 'info',
      ip: '192.168.1.100',
      details: 'Reporte GRD generado: reporte_enero_2024.pdf'
    },
    {
      id: '6',
      user: 'maria.gonzalez@ucchristus.cl',
      action: 'Logout',
      timestamp: '2024-01-20 14:05:00',
      type: 'info',
      ip: '192.168.1.101',
      details: 'Sesión cerrada correctamente'
    },
    {
      id: '7',
      user: 'sistema@ucchristus.cl',
      action: 'Respaldo automático',
      timestamp: '2024-01-20 14:00:00',
      type: 'success',
      ip: '192.168.1.1',
      details: 'Respaldo completado: backup_20240120_140000.zip'
    },
    {
      id: '8',
      user: 'carlos.lopez@ucchristus.cl',
      action: 'Error de conexión',
      timestamp: '2024-01-20 13:55:30',
      type: 'error',
      ip: '192.168.1.102',
      details: 'Timeout en consulta a base de datos'
    }
  ]);

  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');

  // Cargar configuración desde localStorage al montar el componente
  useEffect(() => {
    const savedConfig = localStorage.getItem('grd_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    }
  }, []);

  // Estado mock de usuarios
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan.perez@ucchristus.cl',
      role: 'codificador',
      status: 'active',
      createdAt: '2024-01-15',
      lastLogin: '2024-01-20'
    },
    {
      id: '2',
      name: 'María González',
      email: 'maria.gonzalez@ucchristus.cl',
      role: 'finanzas',
      status: 'active',
      createdAt: '2024-01-10',
      lastLogin: '2024-01-19'
    },
    {
      id: '3',
      name: 'Carlos López',
      email: 'carlos.lopez@ucchristus.cl',
      role: 'gestion',
      status: 'inactive',
      createdAt: '2024-01-05',
      lastLogin: '2024-01-15'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setConfigChanged(true);
  };

  const handleSaveConfig = () => {
    // Simular guardado en backend
    localStorage.setItem('grd_config', JSON.stringify(config));
    setConfigChanged(false);
    setFeedback({ type: 'success', message: 'Configuración guardada correctamente' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetConfig = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      const defaultConfig = {
        autoValidation: true,
        strictMode: false,
        maxFileSize: 10,
        allowedExtensions: ['xlsx', 'xls', 'csv'],
        backupPath: '/backups/grd',
        autoBackup: true,
        backupFrequency: 24,
        emailNotifications: true,
        slackNotifications: false,
        notificationEmail: 'admin@ucchristus.cl',
        sessionTimeout: 480,
        maxLoginAttempts: 3,
        passwordMinLength: 8,
        cacheEnabled: true,
        cacheExpiry: 60,
        maxConcurrentUsers: 50
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Editar usuario existente
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...formData }
          : u
      ));
      setFeedback({ type: 'success', message: 'Usuario actualizado correctamente' });
    } else {
      // Crear nuevo usuario
      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers(prev => [...prev, newUser]);
      setFeedback({ type: 'success', message: 'Usuario creado correctamente' });
    }

    setShowUserForm(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'codificador', status: 'active' });
    
    // Limpiar feedback después de 3 segundos
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowUserForm(true);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
    setFeedback({ type: 'success', message: 'Estado del usuario actualizado' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setFeedback({ type: 'success', message: 'Usuario eliminado correctamente' });
      setTimeout(() => setFeedback(null), 3000);
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
                      setFormData({ name: '', email: '', role: 'codificador', status: 'active' });
                      setShowUserForm(true);
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    + Nuevo Usuario
                  </button>
                </div>

                {/* Tabla de usuarios */}
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
                      disabled={!configChanged}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        configChanged
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Validaciones Automáticas */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      Validaciones Automáticas
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Validación Automática</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.autoValidation}
                            onChange={(e) => handleConfigChange('autoValidation', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Modo Estricto</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.strictMode}
                            onChange={(e) => handleConfigChange('strictMode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Tamaño Máximo de Archivo: {config.maxFileSize} MB
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={config.maxFileSize}
                          onChange={(e) => handleConfigChange('maxFileSize', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>1 MB</span>
                          <span>100 MB</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rutas de Respaldo */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </span>
                      Rutas de Respaldo
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Ruta de Respaldo
                        </label>
                        <input
                          type="text"
                          value={config.backupPath}
                          onChange={(e) => handleConfigChange('backupPath', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Respaldo Automático</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.autoBackup}
                            onChange={(e) => handleConfigChange('autoBackup', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Frecuencia de Respaldo: {config.backupFrequency} horas
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="168"
                          value={config.backupFrequency}
                          onChange={(e) => handleConfigChange('backupFrequency', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>1 hora</span>
                          <span>1 semana</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notificaciones */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12 7H4.828z" />
                        </svg>
                      </span>
                      Notificaciones
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Notificaciones por Email</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.emailNotifications}
                            onChange={(e) => handleConfigChange('emailNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Notificaciones Slack</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.slackNotifications}
                            onChange={(e) => handleConfigChange('slackNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email de Notificaciones
                        </label>
                        <input
                          type="email"
                          value={config.notificationEmail}
                          onChange={(e) => handleConfigChange('notificationEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
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
                          Timeout de Sesión: {config.sessionTimeout} minutos
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="1440"
                          value={config.sessionTimeout}
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
                          Intentos Máximos de Login: {config.maxLoginAttempts}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={config.maxLoginAttempts}
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
                          Longitud Mínima de Contraseña: {config.passwordMinLength} caracteres
                        </label>
                        <input
                          type="range"
                          min="6"
                          max="20"
                          value={config.passwordMinLength}
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

                  {/* Rendimiento */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      Rendimiento
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">Cache Habilitado</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.cacheEnabled}
                            onChange={(e) => handleConfigChange('cacheEnabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Expiración de Cache: {config.cacheExpiry} minutos
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="240"
                          value={config.cacheExpiry}
                          onChange={(e) => handleConfigChange('cacheExpiry', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>5 min</span>
                          <span>4 horas</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Usuarios Concurrentes Máximos: {config.maxConcurrentUsers}
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          value={config.maxConcurrentUsers}
                          onChange={(e) => handleConfigChange('maxConcurrentUsers', parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>10</span>
                          <span>200</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-900">Logs y Monitoreo del Sistema</h2>
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
                              <div className="text-sm text-slate-500">{log.timestamp}</div>
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
                      setFormData({ name: '', email: '', role: 'codificador', status: 'active' });
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
