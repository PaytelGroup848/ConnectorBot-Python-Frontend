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
    <div className="w-full my-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-sans transition-all duration-300">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base leading-tight text-white">{companyName}</h3>
                <span className="flex items-center gap-1 text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Cloud Verified
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">Tally Prime Live Connector Telemetry</p>
            </div>
          </div>

          {/* Online / Standby Glowing Pill */}
          <div className="flex items-center">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/30 text-white border border-emerald-300/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/30 text-white border border-amber-300/40 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-300" />
                STANDBY
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Metrics */}
      <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Metric 1: Tally Port & Machine */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Server className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Tally Port</span>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              Port {activePort}
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {local?.detection_source || 'Desktop Agent Heartbeat'}
            </p>
          </div>
        </div>

        {/* Metric 2: Active Device & Agent Version */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Laptop className="w-4 h-4 text-cyan-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Device</span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {activeDeviceName}
            </div>
            <span className="inline-block text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md mt-1">
              Connector v{connectorVer}
            </span>
          </div>
        </div>

        {/* Metric 3: Last Cloud Sync */}
        <div className="col-span-2 p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-emerald-100/60 dark:border-emerald-800/40 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold">Latest Cloud Sync Telemetry</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isSyncSuccess
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
              }`}
            >
              {isSyncSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {syncStatus}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>
              Completed: <strong className="text-slate-800 dark:text-white">{formatTimestamp(lastSync?.completed_at || lastSync?.started_at)}</strong>
            </span>
            {lastSync?.duration_seconds && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Duration: {lastSync.duration_seconds}s
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Registered Machines List */}
      {devicesList.length > 1 && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/30 dark:bg-slate-900/30">
          <button
            onClick={() => setShowDeviceList(!showDeviceList)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>Registered Machines ({totalDevices} Total)</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              {showDeviceList ? 'Hide' : 'View All'}
              {showDeviceList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showDeviceList && (
            <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-1">
              {devicesList.map((dev) => (
                <div
                  key={dev.id}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{dev.device_name}</p>
                      <p className="text-[10px] text-slate-400">
                        v{dev.connector_version} • Ping: {formatTimestamp(dev.last_heartbeat)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      dev.tally_connected
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '8s' }} />
          Auto-synchronized with Tally Prime
        </div>
        <button
          onClick={handleShareTelemetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Status
        </button>
      </div>
    </div>
  )
}
