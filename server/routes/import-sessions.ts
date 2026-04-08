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
    const sourceSnapshot = sessionData.source_snapshot_json
    const transformedRecords = sessionData.transformed_records_json
    const validationResult = sessionData.validation_result_json as { records?: unknown[] } | null | undefined

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
      templateType: typeof sessionData.template_type === 'string' ? sessionData.template_type : null,
    })

    const supabase = getServiceClient()

    if (sessionId) {
      const { data, error } = await supabase
        .from('migration_sessions')
        .update({
          ...sessionData,
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
      .insert(sessionData)
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
