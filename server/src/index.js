import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { callModel } from './callModel.js'
import { handleInterpret } from './routes/interpret.js'
import { handleBuild } from './routes/build.js'
import { handleFix } from './routes/fix.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '4mb' }))

// Health
app.get('/health', (_req, res) => res.json({ ok: true }))

// Generation pipeline endpoints
app.post('/api/interpret', handleInterpret)
app.post('/api/build', handleBuild)
app.post('/api/fix', handleFix)

// Expose callModel for potential future routes
export { callModel }

app.listen(PORT, () => {
  console.log(`praxis-server listening on :${PORT}`)
})
