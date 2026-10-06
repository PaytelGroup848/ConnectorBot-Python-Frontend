import type { TallyCompany } from '../../core/types'
import { api } from '../../core/api'

// Cached list of connected Tally companies for the current tenant/user
let cachedCompanies: TallyCompany[] = []
let lastFetchedAt = 0

export function getCompanyName(kc: TallyCompany | any): string {
  if (!kc) return ''
  return String(kc.name || kc.company_name || kc.tallyCompanyName || '').trim()
}

/**
 * Fetches and caches the list of connected Tally companies.
 */
export async function getConnectedCompanies(forceRefresh = false): Promise<TallyCompany[]> {
  const now = Date.now()
  if (!forceRefresh && (cachedCompanies.length > 0 || lastFetchedAt > 0) && now - lastFetchedAt < 60000) {
    return cachedCompanies
  }
  lastFetchedAt = now
  try {
    const list = await api.fetchCompanies()
    if (list && Array.isArray(list) && list.length > 0) {
      cachedCompanies = list
    }
  } catch (err) {
    // Cooldown in effect, graceful silent fallback
  }
  return cachedCompanies
}

/**
 * Inspects host web page DOM (header, nav bar, company dropdown switcher) to discover the active company.
 * Ground truth: whatever is currently visible in the host top bar/header is the active company.
 */
export function detectActiveCompanyFromDOM(
  knownCompanies: TallyCompany[] = []
): { name: string; id?: string } | null {
  if (typeof document === 'undefined') return null

  const hostWidget = document.getElementById('ctrlbooks-ai-widget-host')

  // Find all elements visible in the top 140px header region of the host page
  const allHostElements = Array.from(
    document.querySelectorAll(
      'header, nav, [class*="header"], [class*="navbar"], [class*="topbar"], button, [role="button"], select, div, span, a'
    )
  ).filter((el) => {
    // Ignore anything inside our own widget shadow host
    if (hostWidget && hostWidget.contains(el)) return false
    try {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.top <= 140 && r.height > 0 && r.width > 0 && r.width <= 600
    } catch (e) {
      return false
    }
  })

  // 1. If knownCompanies are available, match against elements in header
  if (knownCompanies && knownCompanies.length > 0) {
    for (const el of allHostElements) {
      const rawText = (el.textContent || '').trim()
      if (!rawText || rawText.length < 3 || rawText.length > 80) continue
      const lowerText = rawText.toLowerCase()

      for (const comp of knownCompanies) {
        const cName = getCompanyName(comp)
        if (!cName || cName.length < 3) continue
        const lowerCName = cName.toLowerCase().trim()

        // Exact match or includes full name
        if (lowerText === lowerCName || lowerText.includes(lowerCName)) {
          return { name: cName, id: comp.id }
        }

        // Clean name match (e.g. "DRA Marketing LLP" -> "dra marketing", "Venkateshwara Traders" -> "venkateshwara")
        const cleanCName = lowerCName
          .replace(/\b(company|firm|ltd|pvt|enterprise|enterprises|trader|traders|agency|llp|limited)\b/g, '')
          .trim()
        if (cleanCName.length >= 3 && lowerText.includes(cleanCName)) {
          return { name: cName, id: comp.id }
        }
      }
    }
  }

  // 2. Generic dropdown button inspection (e.g. button with chevron ▼ or svg in top area)
  for (const el of allHostElements) {
    const rawText = (el.textContent || '').trim()
    if (!rawText || rawText.length < 3 || rawText.length > 60) continue
    if (/^(dashboard|menu|home|help|support|logout|notifications?|profile|settings?)$/i.test(rawText)) {
      continue
    }

    const hasChevron =
      el.querySelector('svg') ||
      rawText.includes('▼') ||
      rawText.includes('⌄') ||
      rawText.includes('▾')
    if (hasChevron) {
      const clean = rawText.replace(/[▼⌄▾\s]+/g, ' ').trim()
      if (clean.length >= 3) {
        for (const comp of knownCompanies) {
          const cName = getCompanyName(comp)
          if (
            cName.toLowerCase().includes(clean.toLowerCase()) ||
            clean.toLowerCase().includes(cName.toLowerCase())
          ) {
            return { name: cName, id: comp.id }
          }
        }
        return { name: clean }
      }
    }
  }

  return null
}

/**
 * Inspects localStorage and sessionStorage for any active company identifiers or objects.
 */
export function detectActiveCompanyFromStorage(
  knownCompanies: TallyCompany[] = []
): { name: string; id?: string } | null {
  if (typeof window === 'undefined') return null

  const candidateKeys = [
    'activeCompanyName',
    'activeCompany',
    'selectedCompany',
    'currentCompany',
    'companyName',
    'company_name',
    'company',
    'tallyCompany',
    'selected_company',
    'active_company',
    'defaultCompany',
    'current_tenant',
    'tenant',
  ]

  const storages = [window.localStorage, window.sessionStorage]

  for (const store of storages) {
    if (!store) continue
    for (const key of candidateKeys) {
      try {
        const val = store.getItem(key)
        if (!val) continue

        const cleanVal = val.trim()
        if (!cleanVal || cleanVal === 'undefined' || cleanVal === 'null') continue

        // Check if value is JSON
        if (cleanVal.startsWith('{') || cleanVal.startsWith('[')) {
          try {
            const parsed = JSON.parse(cleanVal)
            const obj = Array.isArray(parsed) ? parsed[0] : parsed
            if (obj && typeof obj === 'object') {
              const nameCand =
                obj.tallyCompanyName ||
                obj.company_name ||
                obj.companyName ||
                obj.name ||
                obj.title
              const idCand = obj.id || obj._id || obj.companyId
              if (nameCand && typeof nameCand === 'string') {
                const trimmedName = nameCand.trim()
                if (
                  trimmedName &&
                  !['ctrlbooks', 'default', 'connected company'].includes(
                    trimmedName.toLowerCase()
                  )
                ) {
                  return {
                    name: trimmedName,
                    id: idCand ? String(idCand).trim() : undefined,
                  }
                }
              }
            }
          } catch (e) {}
        } else {
          // Direct string candidate
          for (const kc of knownCompanies) {
            const kn = getCompanyName(kc).toLowerCase()
            const cv = cleanVal.toLowerCase()
            if (kn && (cv === kn || cv.includes(kn) || kn.includes(cv))) {
              return { name: getCompanyName(kc), id: kc.id }
            }
          }
          if (
            cleanVal.length >= 3 &&
            !['true', 'false', '0', '1', 'default', 'ctrlbooks'].includes(
              cleanVal.toLowerCase()
            )
          ) {
            return { name: cleanVal }
          }
        }
      } catch (e) {}
    }
  }

  return null
}

/**
 * Resolves the currently active company using multi-tier SaaS heuristics.
 * Ground truth priority:
 * 1. LIVE DOM Header/Dropdown (Current user screen selection)
 * 2. Storage (localStorage / sessionStorage)
 * 3. Script dataset / external override
 * 4. Fallback (First connected company or CtrlBooks)
 */
export function resolveCurrentActiveCompany(
  knownCompanies: TallyCompany[] = []
): { name: string; id?: string } {
  // 1. PRIORITY 1: LIVE DOM Header Dropdown
  // Whatever company is visually selected in the top bar right now is the active company
  const fromDOM = detectActiveCompanyFromDOM(knownCompanies)
  if (fromDOM && fromDOM.name && fromDOM.name.toLowerCase() !== 'ctrlbooks') {
    return fromDOM
  }

  // 2. PRIORITY 2: Storage inspection (localStorage / sessionStorage)
  const fromStorage = detectActiveCompanyFromStorage(knownCompanies)
  if (fromStorage && fromStorage.name && fromStorage.name.toLowerCase() !== 'ctrlbooks') {
    return fromStorage
  }

  // 3. PRIORITY 3: Explicit dataset or external script config (if not default)
  if (typeof window !== 'undefined') {
    const cfg = (window as any).CtrlBooksAI || {}
    // Only trust if explicitly set and not equal to default
    if (
      cfg.companyName &&
      typeof cfg.companyName === 'string' &&
      !['ctrlbooks', 'default', 'your company', 'connected company', ''].includes(
        cfg.companyName.trim().toLowerCase()
      )
    ) {
      const matched = knownCompanies.find(
        (kc) =>
          getCompanyName(kc).toLowerCase() ===
          cfg.companyName.trim().toLowerCase()
      )
      return {
        name: cfg.companyName.trim(),
        id: cfg.companyId || matched?.id,
      }
    }
  }

  // 4. PRIORITY 4: First known company from connected companies (if available)
  if (knownCompanies && knownCompanies.length > 0) {
    const first = knownCompanies[0]
    return { name: getCompanyName(first), id: first.id }
  }

  return { name: 'CtrlBooks' }
}
