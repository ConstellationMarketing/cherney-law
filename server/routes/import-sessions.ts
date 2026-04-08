import type { Request, RequestHandler } from 'express'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

function getSessionListLimit(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return 10
  return Math.min(Math.trunc(parsed), 25)
}

const MAX_PERSISTED_SESSION_PAYLOAD_BYTES = 8 * 1024 * 1024

function getApproxPayloadBytes(req: Request) {
  const headerValue = req.headers['content-length']
  const parsedHeader = Number(Array.isArray(headerValue) ? headerValue[0] : headerValue)
  if (Number.isFinite(parsedHeader) && parsedHeader > 0) return parsedHeader

  try {
    return Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8')
  } catch {
    return 0
  }
}

function getSerializedBytes(value: unknown) {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? {}), 'utf8')
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

function sanitizeSessionDataForPersistence(sessionData: Record<string, unknown>) {
  const sanitized = { ...sessionData }
  let trimmedHeavyFields = false
  let serializedBytes = getSerializedBytes(sanitized)

  if (serializedBytes > MAX_PERSISTED_SESSION_PAYLOAD_BYTES && sanitized.validation_result_json) {
    delete sanitized.validation_result_json
    trimmedHeavyFields = true
    serializedBytes = getSerializedBytes(sanitized)
  }

  if (serializedBytes > MAX_PERSISTED_SESSION_PAYLOAD_BYTES && sanitized.transformed_records_json) {
    delete sanitized.transformed_records_json
    trimmedHeavyFields = true
    serializedBytes = getSerializedBytes(sanitized)
  }

  if (serializedBytes > MAX_PERSISTED_SESSION_PAYLOAD_BYTES && sanitized.source_snapshot_json) {
    delete sanitized.source_snapshot_json
    trimmedHeavyFields = true
  }

  return {
    sanitized,
    trimmedHeavyFields,
  }
}

export const handleListImportSessions: RequestHandler = async (req, res) => {
  try {
    const supabase = getServiceClient()
    const limit = getSessionListLimit(req.query.limit)
    const { data, error } = await supabase
      .from('migration_sessions')
      .select('id, name, template_type, current_step, updated_at, status')
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data ?? [])
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
}

export const handleGetImportSession: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      res.status(400).json({ error: 'Missing session id' })
      return
    }

    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('migration_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      const statusCode = error.code === 'PGRST116' ? 404 : 500
      res.status(statusCode).json({ error: statusCode === 404 ? 'Session not found' : error.message })
      return
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
}

export const handleSaveImportSession: RequestHandler = async (req, res) => {
  try {
    const { sessionId, sessionData } = req.body as {
      sessionId?: string | null
      sessionData?: Record<string, unknown>
    }

    if (!sessionData || typeof sessionData !== 'object') {
      res.status(400).json({ error: 'Missing sessionData payload' })
      return
    }

    const payloadBytes = getApproxPayloadBytes(req)
    const { sanitized: sanitizedSessionData, trimmedHeavyFields } = sanitizeSessionDataForPersistence(sessionData)
    const sourceSnapshot = sanitizedSessionData.source_snapshot_json
    const transformedRecords = sanitizedSessionData.transformed_records_json
    const validationResult = sanitizedSessionData.validation_result_json as { records?: unknown[] } | null | undefined

    console.info('[import-sessions] save request', {
      sessionId: sessionId ?? null,
      payloadBytes,
      includesSourceSnapshot: Array.isArray(sourceSnapshot),
      sourceRowCount: Array.isArray(sourceSnapshot) ? sourceSnapshot.length : 0,
      includesTransformedRecords: Array.isArray(transformedRecords),
      transformedRecordCount: Array.isArray(transformedRecords) ? transformedRecords.length : 0,
      includesValidationResult: Boolean(validationResult),
      validationRecordCount: Array.isArray(validationResult?.records) ? validationResult.records.length : 0,
      currentStep: typeof sessionData.current_step === 'string' ? sessionData.current_step : null,
      templateType: typeof sanitizedSessionData.template_type === 'string' ? sanitizedSessionData.template_type : null,
      trimmedHeavyFields,
    })

    const supabase = getServiceClient()

    if (sessionId) {
      const { data, error } = await supabase
        .from('migration_sessions')
        .update({
          ...sanitizedSessionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select('id')
        .single()

      if (error) {
        res.status(500).json({ error: error.message })
        return
      }

      res.json({ id: data.id })
      return
    }

    const { data, error } = await supabase
      .from('migration_sessions')
      .insert(sanitizedSessionData)
      .select('id')
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ id: data.id })
  } catch (err) {
    console.error('[import-sessions] save failed', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
}

export const handleUpdateImportSessionStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body as { status?: 'completed' | 'abandoned' }

    if (!id) {
      res.status(400).json({ error: 'Missing session id' })
      return
    }

    if (status !== 'completed' && status !== 'abandoned') {
      res.status(400).json({ error: 'Invalid session status' })
      return
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('migration_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
}
