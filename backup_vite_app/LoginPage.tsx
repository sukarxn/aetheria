import React, { useState } from 'react';
import { LogIn, Lock, User, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('researcher');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const HARDCODED_USERNAME = 'user001';
  const HARDCODED_PASSWORD = '123456789';

  const roles = [
    { id: 'researcher', label: 'Researcher', description: 'Conduct research and analysis' },
    { id: 'manager', label: 'Manager', description: 'Oversee projects and teams' },
    { id: 'analyst', label: 'Analyst', description: 'Review and analyze data' },
    { id: 'admin', label: 'Administrator', description: 'System administration' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
      onLogin(selectedRole);
    } else {
      setError('Invalid username or password. Use user001/123456789');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Medical Collage Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-50 relative overflow-hidden items-center justify-center p-8 border-r border-slate-200">
        {/* Medical Collage Grid */}
        <div className="relative w-full h-full max-w-md">
          {/* Top Left - DNA/Molecular */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-4xl opacity-80 hover:opacity-100 transition-opacity">
            🧬
          </div>
          
          {/* Top Right - Microscope/Lab */}
          <div className="absolute top-8 right-0 w-32 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-4xl opacity-80 hover:opacity-100 transition-opacity">
            🔬
          </div>
          
          {/* Center Left - Heart/Health */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-4xl opacity-80 hover:opacity-100 transition-opacity">
            ❤️
          </div>
          
          {/* Center - Medical Chart */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-5xl opacity-80 hover:opacity-100 transition-opacity">
            📊
          </div>
          
          {/* Center Right - Pills/Pharmacy */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-4xl opacity-80 hover:opacity-100 transition-opacity">
            💊
          </div>
          
          {/* Bottom Left - Research/Book */}
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-4xl opacity-80 hover:opacity-100 transition-opacity">
            📚
          </div>
          
          {/* Bottom Right - Stethoscope */}
          <div className="absolute bottom-8 right-0 w-32 h-32 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center text-4xl opacity-80 hover:opacity-100 transition-opacity">
            🩺
          </div>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent"></div>
        
        {/* Bottom text */}
        <div className="absolute bottom-8 left-8 z-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Biomed Nexus AI</h2>
          <p className="text-slate-600 text-sm">Advanced Research Intelligence Platform</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Biomed Nexus AI</h1>
            <p className="text-slate-600 text-sm mt-1">Research Intelligence Platform</p>
          </div>

          {/* Form Container */}
          <div className="bg-white">
            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">Select Your Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-md border transition-all duration-200 text-left ${
                        selectedRole === role.id
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{role.label}</div>
                      <div className="text-xs text-slate-500">{role.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-slate-900 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-md text-slate-900 placeholder-slate-500 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Hint */}
            <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-md">
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Demo Credentials:</span><br/>
                Username: <code className="bg-white px-1 rounded text-slate-900">user001</code><br/>
                Password: <code className="bg-white px-1 rounded text-slate-900">123456789</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
