import { useCallback, useMemo, useState } from "react"
import { getApiKeysMeta, setApiKeysMeta } from "../api/api"
import { fetchApiKeys, saveApiKeys } from "../api/apiKeys"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }) {
  const [apiKeys, setApiKeys] = useState(() => getApiKeysMeta())

  const syncApiKeys = useCallback((meta) => {
    setApiKeysMeta(meta)
    setApiKeys(meta)
  }, [])

  const loadApiKeys = useCallback(async () => {
    const meta = await fetchApiKeys()
    syncApiKeys(meta)
    return meta
  }, [syncApiKeys])

  const updateGeminiKey = useCallback(
    async (gemini_api_key) => {
      const meta = await saveApiKeys({ gemini_api_key })
      syncApiKeys(meta)
      return meta
    },
    [syncApiKeys]
  )

  const value = useMemo(
    () => ({
      apiKeys,
      syncApiKeys,
      loadApiKeys,
      updateGeminiKey,
    }),
    [apiKeys, syncApiKeys, loadApiKeys, updateGeminiKey]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
