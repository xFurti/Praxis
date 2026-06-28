import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { callModel } from './callModel.js'
import { handleVision } from './routes/vision.js'
import { handleInterpret } from './routes/interpret.js'
import { handleBuild } from './routes/build.js'
import { handleFix } from './routes/fix.js'
import { handleSpeedCompare } from './routes/speedCompare.js'
import { handleProviderCapabilities } from './routes/providerCapabilities.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '16mb' }))

// Health
app.get('/health', (_req, res) => res.json({ ok: true }))

// Generation pipeline endpoints
app.post('/api/vision', handleVision)
app.post('/api/interpret', handleInterpret)
app.post('/api/build', handleBuild)
app.post('/api/fix', handleFix)
app.get('/api/speed-compare', handleSpeedCompare)
app.get('/api/provider-capabilities', handleProviderCapabilities)

app.use((err, _req, res, _next) => {
  const status = typeof err?.statusCode === 'number' ? err.statusCode : 500
  const message = err?.publicMessage || 'Internal server error.'

  console.error(err)
  res.status(status).json({ error: message })
})

// Expose callModel for potential future routes
export { callModel }

app.listen(PORT, () => {
  console.log(`praxis-server listening on :${PORT}`)
})
