import { useState, useEffect } from 'react'
import {
  Menu,
  ChevronDown,
  Smartphone,
  Phone,
  Search,
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  ShoppingCart,
  Landmark,
  Coins,
  Users,
  Package,
  BarChart2,
  FileCheck2,
  Receipt,
  BookOpen,
  FileSearch,
  Code2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { CtrlBooksWidget } from '../widget/CtrlBooksWidget'
import { api } from '../core/api'

export const MockCtrlBooksPortal = () => {
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [companiesList, setCompaniesList] = useState<string[]>([])
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false)
  const [gstQuery, setGstQuery] = useState('')
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedReact, setCopiedReact] = useState(false)

  useEffect(() => {
    api.fetchCompanies()
      .then((comps) => {
        if (comps && comps.length > 0) {
          const names = comps
            .map((c: any) => (c?.name || c?.company_name || '').trim())
            .filter(Boolean)
          if (names.length > 0) {
            setCompaniesList(names)
            setSelectedCompany(names[0])
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load companies in MockCtrlBooksPortal:', err)
      })
  }, [])

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: PlusCircle, label: 'Create Vouchers' },
    { icon: TrendingUp, label: 'Sales', hasChevron: true },
    { icon: ShoppingCart, label: 'Purchase', hasChevron: true },
    { icon: Landmark, label: 'Cash & Bank', hasChevron: true },
    { icon: Coins, label: 'Collect Payments' },
    { icon: Users, label: 'Parties' },
    { icon: Package, label: 'Items' },
    { icon: BarChart2, label: 'Reports', hasChevron: true },
    { icon: FileCheck2, label: 'My Entries', hasChevron: true },
    { icon: Receipt, label: 'Vouchers' },
    { icon: BookOpen, label: 'Ledgers' },
  ]

  const widgetBaseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://api.ctrlbooks.com'
  const scriptTagCode = `<script>
  window.CtrlBooksAI = {
    userName: window.CURRENT_USER_NAME,
    userEmail: window.CURRENT_USER_EMAIL,
    userPhone: window.CURRENT_USER_PHONE,
    companyName: "${selectedCompany || 'Your Company'}",
    tallyPort: window.USER_TALLY_PORT // Auto-scanned dynamically if omitted
  };
</script>
<script src="${widgetBaseOrigin}/static/widget.js" defer></script>`
  const reactCode = `import { CtrlBooksWidget } from './components/CtrlBooksWidget'

export default function App({ currentUser }) {
  return (
    <div>
      {/* Your existing CtrlBooks pages */}
      <CtrlBooksWidget
        companyName="${selectedCompany || 'Your Company'}"
        userName={currentUser.name}
        userEmail={currentUser.email}
        userPhone={currentUser.phone}
        tallyPort={currentUser.tallyPort}
      />
    </div>
  )
}`

  const copyToClipboard = (text: string, type: 'script' | 'react') => {
    navigator.clipboard.writeText(text)
    if (type === 'script') {
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 2000)
    } else {
      setCopiedReact(true)
      setTimeout(() => setCopiedReact(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      {/* Live Integration Notice Banner */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white px-6 py-2 flex items-center justify-between text-xs font-medium z-50">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-300" />
          <span>
            <strong>CtrlBooks.com Live Integration Preview:</strong> AI Assistant Widget is mounted at the bottom-right corner!
          </span>
        </div>
        <div className="flex items-center space-x-2.5">
          <a
            href="https://patwatoliai.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white text-xs font-semibold border border-white/20 shadow-xs transition"
            title="Visit patwatoliai.com"
          >
            <span>Powered by patwatoliai.com</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>View Embed Code for CtrlBooks.com</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Exact Dark Navy Sidebar matching ctrlbooks.com */}
        <aside className="w-64 bg-[#0a1128] text-slate-300 flex flex-col justify-between shrink-0 h-[calc(100vh-2.25rem)] sticky top-9">
          <div>
            {/* Logo */}
            <div className="h-14 flex items-center px-5 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-linear-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-slate-900 text-xs">
                  C
                </div>
                <span className="font-bold text-lg text-white tracking-tight">CtrlBooks</span>
              </div>
            </div>

            {/* Menu List */}
            <nav className="p-3 space-y-0.5 text-xs font-medium">
              {sidebarItems.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 text-slate-300 hover:text-white cursor-pointer transition"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.hasChevron && <span className="text-slate-500 text-[10px]">›</span>}
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Bottom GST Search & Phone matching user's screenshot */}
          <div className="p-3 space-y-2 border-t border-slate-800/80">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition">
              <div className="flex items-center space-x-2">
                <FileSearch className="w-4 h-4" />
                <span>GST Search</span>
              </div>
              <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">
                NEW
              </span>
            </button>

            <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center space-x-2.5 text-xs text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Need help?</span>
                <span className="font-mono text-emerald-400 font-bold">+91 9311472357</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area matching https://ctrlbooks.com/gst-search */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar matching user's screenshot */}
          <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4">
              <Menu className="w-5 h-5 text-slate-600 cursor-pointer" />
              <div className="relative">
                <div
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="flex items-center space-x-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition select-none"
                >
                  <span>{selectedCompany}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </div>

                {isCompanyDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                    <span className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active SaaS Company Context
                    </span>
                    {companiesList.length > 0 ? (
                      companiesList.map((comp) => (
                        <button
                          key={comp}
                          onClick={() => {
                            setSelectedCompany(comp)
                            setIsCompanyDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between ${
                            selectedCompany === comp
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{comp}</span>
                          {selectedCompany === comp && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-500 font-medium">
                        {selectedCompany}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1 text-slate-600 cursor-pointer hover:text-slate-900">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Mobile Version</span>
              </div>

              {/* Connector Status Indicator */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Connector Active</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              {/* User Avatar */}
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                {selectedCompany
                  ? (selectedCompany
                      .split(' ')
                      .map((w) => w[0] || '')
                      .slice(0, 2)
                      .join('') || 'CB').toUpperCase()
                  : 'CB'}
              </div>
            </div>
          </header>

          {/* Page Body: GSTIN Search */}
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6 pt-6">
              {/* Header with green icon */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <FileSearch className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">GSTIN Search</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify GST Number and get business details instantly
                  </p>
                </div>
              </div>

              {/* Search Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gstQuery}
                      onChange={(e) => setGstQuery(e.target.value)}
                      placeholder="Enter GST Number (e.g. 29AAICA3918J1ZE)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <button className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Format: 22AAAAA0000A1Z5 (15 Digits)
                </span>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Floating AI Assistant Widget sitting at bottom right */}
      <CtrlBooksWidget
        initialOpen={true}
        companyName={selectedCompany}
        forceShow={true}
      />

      {/* Embed Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-100000 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Embed CtrlBooks AI on your Live Website
                </h3>
                <p className="text-xs text-slate-500">
                  Apni <code className="text-emerald-700">ctrlbooks.com</code> website par AI Widget lagane ke 2 aasaan options:
                </p>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Option 1: HTML Script Tag */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Option 1: 1-Line HTML Script Tag (Any Website / PHP / HTML)
                </span>
                <button
                  onClick={() => copyToClipboard(scriptTagCode, 'script')}
                  className="flex items-center space-x-1 text-xs text-emerald-700 font-semibold"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied!' : 'Copy Tag'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto">
                {scriptTagCode}
              </pre>
            </div>

            {/* Option 2: React Component */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Option 2: React / Next.js Component Import
                </span>
                <button
                  onClick={() => copyToClipboard(reactCode, 'react')}
                  className="flex items-center space-x-1 text-xs text-emerald-700 font-semibold"
                >
                  {copiedReact ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReact ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto">
                {reactCode}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
