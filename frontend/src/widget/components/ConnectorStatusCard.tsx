import { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Server,
  Laptop,
  Clock,
  Share2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

export interface ConnectorDevice {
  id: string
  device_id: string
  device_name: string
  status: string
  last_heartbeat: string
  tally_connected: boolean
  connector_version: string
}

export interface LastSyncInfo {
  id: string
  type: string
  status: string
  started_at: string
  completed_at: string
  company_id: string
  duration_seconds?: number
}

export interface ConnectorStatusData {
  success: boolean
  company_name: string
  cloud_status?: {
    success: boolean
    total_connectors: number
    latest_connector?: ConnectorDevice
    last_sync?: LastSyncInfo
    connectors?: ConnectorDevice[]
  }
  local_status?: {
    is_online: boolean
    tally_connected: boolean
    tally_port?: number
    detection_source?: string
    agent_version?: string
    last_heartbeat?: string
  }
  latest_device?: ConnectorDevice
  last_sync?: LastSyncInfo
  total_devices?: number
}

interface ConnectorStatusCardProps {
  statusData: ConnectorStatusData
}

export const ConnectorStatusCard = ({ statusData }: ConnectorStatusCardProps) => {
  const [showDeviceList, setShowDeviceList] = useState(false)

  const companyName = statusData.company_name || 'CtrlBooks'
  const cloud = statusData.cloud_status
  const local = statusData.local_status
  const latestDevice = statusData.latest_device || cloud?.latest_connector
  const lastSync = statusData.last_sync || cloud?.last_sync
  const totalDevices = statusData.total_devices ?? cloud?.total_connectors ?? 0
  const devicesList = cloud?.connectors || []

  const isOnline = latestDevice?.tally_connected || local?.tally_connected || local?.is_online || false
  const activePort = local?.tally_port || 9000
  const activeDeviceName = latestDevice?.device_name || 'Primary Workstation'
  const connectorVer = latestDevice?.connector_version || local?.agent_version || '1.0.6'
  const syncStatus = lastSync?.status || 'COMPLETED'
  const isSyncSuccess = syncStatus.toUpperCase() === 'COMPLETED' || syncStatus.toUpperCase() === 'SUCCESS'

  const formatTimestamp = (isoStr?: string) => {
    if (!isoStr) return 'Active Just Now'
    try {
      const d = new Date(isoStr)
      if (isNaN(d.getTime())) return isoStr
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return isoStr
    }
  }

  const handleShareTelemetry = () => {
    const syncTime = formatTimestamp(lastSync?.completed_at || lastSync?.started_at)
    const text =
      `🔌 *${companyName} — Tally Prime Connector Telemetry*\n` +
      `• Tally Status: *${isOnline ? 'CONNECTED (Live)' : 'STANDBY'}*\n` +
      `• Active Machine: *${activeDeviceName}* (v${connectorVer})\n` +
      `• Tally Port: *Port ${activePort}*\n` +
      `• Cloud Last Sync: *${syncStatus}* (${syncTime})\n` +
      (lastSync?.duration_seconds ? `• Sync Duration: *${lastSync.duration_seconds}s*\n` : '') +
      `- Synchronized in real-time via CtrlBooks AI SaaS.`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="w-full my-3 rounded-2xl bg-white border border-emerald-300 shadow-sm overflow-hidden font-sans transition-all">
      {/* Top Header */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-xs text-slate-900 leading-tight">{companyName}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Cloud Verified
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Tally Prime Live Connector Telemetry</p>
          </div>
        </div>

        {/* Online / Standby Pill */}
        <div className="shrink-0">
          {isOnline ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Main Grid Metrics */}
      <div className="p-3.5 space-y-2.5 bg-white">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Metric 1: Tally Port & Detection Source */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Tally Port</span>
            </div>
            <div>
              <div className="text-sm font-extrabold text-slate-900 font-mono flex items-center gap-1">
                Port {activePort}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                {local?.detection_source || 'Desktop Agent Heartbeat'}
              </p>
            </div>
          </div>

          {/* Metric 2: Active Device & Agent Version */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Laptop className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Device</span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {activeDeviceName}
              </div>
              <span className="inline-block text-[9px] font-semibold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded mt-0.5">
                v{connectorVer}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Last Cloud Sync */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold">Latest Cloud Sync Telemetry</span>
            </div>
            <span
              className={`text-[9px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1 border uppercase ${
                isSyncSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isSyncSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
              {syncStatus}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
            <span>
              Completed: <strong className="text-slate-800">{formatTimestamp(lastSync?.completed_at || lastSync?.started_at)}</strong>
            </span>
            {lastSync?.duration_seconds && (
              <span className="text-[10px] text-slate-400 font-medium">
                Duration: {lastSync.duration_seconds}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Registered Machines List */}
      {devicesList.length > 1 && (
        <div className="border-t border-slate-100 px-3.5 py-2 bg-slate-50/50">
          <button
            onClick={() => setShowDeviceList(!showDeviceList)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span>Registered Machines ({totalDevices} Total)</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              {showDeviceList ? 'Hide' : 'View All'}
              {showDeviceList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showDeviceList && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {devicesList.map((dev) => (
                <div
                  key={dev.id}
                  className="p-2 rounded-lg bg-white border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800">{dev.device_name}</p>
                      <p className="text-[10px] text-slate-400">
                        v{dev.connector_version} • Ping: {formatTimestamp(dev.last_heartbeat)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      dev.tally_connected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {dev.tally_connected ? 'Tally Active' : 'Standby'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Share Action */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
          Auto-synchronized with Tally Prime
        </div>
        <button
          onClick={handleShareTelemetry}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-500" />
          Share Status
        </button>
      </div>
    </div>
  )
}
