import type { TallyCompany } from '../../core/types'
import { api } from '../../core/api'

// Cached list of connected Tally companies for the current tenant/user
let cachedCompanies: TallyCompany[] = []
let lastFetchedAt = 0

function getCompanyName(kc: TallyCompany | any): string {
  if (!kc) return ''
  return String(kc.name || kc.company_name || kc.tallyCompanyName || '').trim()
}

/**
 * Fetches and caches the list of connected Tally companies.
 */
export async function getConnectedCompanies(forceRefresh = false): Promise<TallyCompany[]> {
  const now = Date.now()
  if (!forceRefresh && cachedCompanies.length > 0 && now - lastFetchedAt < 30000) {
    return cachedCompanies
  }
  try {
    const list = await api.fetchCompanies()
    if (list && Array.isArray(list) && list.length > 0) {
      cachedCompanies = list
      lastFetchedAt = now
    }
  } catch (err) {
    console.warn('Could not fetch companies for auto-detection:', err)
  }
  return cachedCompanies
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
 * Inspects host web page DOM (header, nav bar, company dropdown switcher) to discover the active company.
 */
export function detectActiveCompanyFromDOM(
  knownCompanies: TallyCompany[] = []
): { name: string; id?: string } | null {
  if (typeof document === 'undefined') return null

  // 1. If knownCompanies are available, scan header / navbar / top area for exact match
  if (knownCompanies && knownCompanies.length > 0) {
    const headerSelectors = [
      'header',
      'nav',
      '[role="navigation"]',
      '[class*="header"]',
      '[class*="navbar"]',
      '[class*="topbar"]',
      'button[aria-haspopup]',
      'button[id*="company"]',
      'button[class*="company"]',
      'div[class*="company"]',
      'div[class*="dropdown"]',
      'select[id*="company"]',
      'select[name*="company"]',
    ]

    const elementsToCheck: Element[] = []
    headerSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => elementsToCheck.push(el))
    })

    // Also include all visible buttons on the top 150px of the page
    document.querySelectorAll('button, select, div[role="button"]').forEach((el) => {
      try {
        const rect = el.getBoundingClientRect()
        if (rect.top <= 140 && rect.height > 0) {
          elementsToCheck.push(el)
        }
      } catch (e) {}
    })

    for (const el of elementsToCheck) {
      const text = (el.textContent || '').trim().toLowerCase()
      if (!text) continue

      for (const comp of knownCompanies) {
        const cName = getCompanyName(comp).toLowerCase()
        if (!cName) continue
        const mainWord = cName.split(/[\s-_]+/)[0]
        if (
          text.includes(cName) ||
          (mainWord.length >= 4 && text.includes(mainWord))
        ) {
          return { name: getCompanyName(comp), id: comp.id }
        }
      }
    }
  }

  // 2. Generic DOM selector inspection: Look for company selector dropdown button next to logo
  try {
    const candidateButtons = Array.from(
      document.querySelectorAll(
        'header button, nav button, div[class*="header"] button, button[class*="dropdown"], div[class*="dropdown"]'
      )
    )
    for (const btn of candidateButtons) {
      const text = (btn.textContent || '').trim()
      if (
        !text ||
        /^(dashboard|menu|home|help|support|logout|notifications?|profile|settings?)$/i.test(
          text
        )
      ) {
        continue
      }
      const hasChevron =
        btn.querySelector('svg') ||
        text.includes('▼') ||
        text.includes('⌄') ||
        text.includes('▾')
      if (hasChevron && text.length >= 3 && text.length <= 60) {
        const cleanName = text.replace(/[▼⌄▾\s]+/g, ' ').trim()
        if (cleanName.length >= 3) {
          const matched = knownCompanies.find((kc) => {
            const kn = getCompanyName(kc).toLowerCase()
            return kn && (kn.includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(kn))
          })
          if (matched) return { name: getCompanyName(matched), id: matched.id }
          return { name: cleanName }
        }
      }
    }
  } catch (e) {}

  return null
}

/**
 * Resolves the currently active company using multi-tier SaaS heuristics.
 */
export function resolveCurrentActiveCompany(
  knownCompanies: TallyCompany[] = []
): { name: string; id?: string } {
  // 1. Explicit window.CtrlBooksAI global config
  if (typeof window !== 'undefined') {
    const cfg = (window as any).CtrlBooksAI || {}
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

  // 2. Storage inspection
  const fromStorage = detectActiveCompanyFromStorage(knownCompanies)
  if (fromStorage && fromStorage.name) return fromStorage

  // 3. DOM inspection
  const fromDOM = detectActiveCompanyFromDOM(knownCompanies)
  if (fromDOM && fromDOM.name) return fromDOM

  // 4. Default fallback
  return { name: 'CtrlBooks' }
}
