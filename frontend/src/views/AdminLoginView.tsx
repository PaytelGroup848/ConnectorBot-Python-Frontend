import { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../core/api'

interface AdminLoginViewProps {
  onLoginSuccess: (adminData: { token: string; user: any }) => void
  onCancel: () => void
}

export const AdminLoginView = ({ onLoginSuccess, onCancel }: AdminLoginViewProps) => {
  const [email, setEmail] = useState('admin@ctrlbooks.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)
    try {
      const data = await api.adminLogin(email.trim(), password)
      onLoginSuccess(data)
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials. Access denied.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-[#00A3E0] selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glows matching CtrlBooks Brand Colors (Blue #00A3E0 & Green #5CBA46) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#00A3E0]/15 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#5CBA46]/15 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-[140px] -z-10"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 text-white overflow-hidden">
        {/* Top Accent Gradient Line matching CtrlBooks dual-color branding */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00A3E0] via-teal-400 to-[#5CBA46]"></div>

        {/* Top Logo & Header */}
        <div className="text-center mb-8 pt-1">
          {/* Prominent Logo Container with crisp white backdrop for high contrast */}
          <div className="inline-flex items-center justify-center px-7 py-3.5 bg-white rounded-2xl shadow-xl shadow-black/20 border border-slate-100/10 mb-5 transition hover:scale-[1.02]">
            <img
              src="/ctrlbooks-logo.png"
              alt="CtrlBooks Logo"
              className="h-11 sm:h-12 w-auto object-contain max-w-[220px]"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = document.getElementById('admin-login-svg-fallback')
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div id="admin-login-svg-fallback" className="hidden items-center space-x-2 px-2">
              <ShieldCheck className="w-8 h-8 text-[#00A3E0]" />
              <span className="font-extrabold text-2xl tracking-tight">
                <span className="text-[#5CBA46]">Ctrl</span>
                <span className="text-[#00A3E0]">Books</span>
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Support & Admin Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Protected internal area. Enter administrator credentials to manage tickets, queues, and Tally sync.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center space-x-2.5 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ctrlbooks.com"
                required
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3E0]/40 focus:border-[#00A3E0] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A3E0]/40 focus:border-[#00A3E0] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[#00A3E0] via-[#24b08f] to-[#5CBA46] hover:opacity-95 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[#00A3E0]/20 hover:shadow-[#5CBA46]/25 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to Admin Console</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link back to Customer View */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-[#00A3E0] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Customer View (ctrlbooks.com)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
