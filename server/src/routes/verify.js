import { callModel } from '../callModel.js'
import { VERIFIER_SPEC_PROMPT, VERIFIER_PUBLISH_PROMPT } from '../praxisPrompts.js'
import { enrichSpecDesign } from '../styleDirector.js'
import { parseSpec } from '../specUtils.js'
import { getDefaultInterpreterProvider } from '../providerConfig.js'
import {
  verifySpecHeuristics,
  verifyPublishHeuristics,
  buildPublishFixHint,
  splitPublishIssues,
} from '../verifyHeuristics.js'
import { deriveCategory, getSizeCalibration, getLearningStore } from '../learningStore.js'

/** POST /api/verify/spec */
export async function handleVerifySpec(req, res, next) {
  try {
    const { spec } = req.body
    if (!spec || typeof spec !== 'object') {
      return res.status(400).json({ error: 'spec is required' })
    }

    const heuristic = verifySpecHeuristics(spec)
    let nextSpec = applySpecPatches(spec, heuristic.patches)
    nextSpec = enrichSpecDesign(await augmentSpecWithSizing(nextSpec))

    let modelIssues = []
    if (heuristic.issues.length > 0) {
      try {
        nextSpec = await runSpecModelVerify(nextSpec, heuristic.issues)
        modelIssues = []
      } catch {
        modelIssues = ['Model spec verification skipped.']
      }
    }

    const recheck = verifySpecHeuristics(nextSpec)

    res.json({
      ok: recheck.issues.length === 0,
      issues: [...heuristic.issues, ...modelIssues, ...recheck.issues],
      spec: nextSpec,
    })
  } catch (err) {
    next(err)
  }
}

/** POST /api/verify/publish */
export async function handleVerifyPublish(req, res, next) {
  try {
    const { spec, html, content_width, content_height, fast } = req.body
    if (!spec || typeof spec !== 'object') {
      return res.status(400).json({ error: 'spec is required' })
    }
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required' })
    }

    const measured = {
      content_width: typeof content_width === 'number' ? content_width : undefined,
      content_height: typeof content_height === 'number' ? content_height : undefined,
    }

    const heuristic = await verifyPublishHeuristics(spec, html, measured)
    const { critical, warnings } = splitPublishIssues(heuristic.issues)
    let issues = [...heuristic.issues]
    let ok = critical.length === 0
    let fix_hint = ''

    if (critical.length > 0) {
      fix_hint = buildPublishFixHint(critical)
    }

    if (!fast && critical.length > 0) {
      try {
        const modelResult = await runPublishModelVerify(spec, html, measured, critical)
        if (modelResult) {
          ok = Boolean(modelResult.ok) && critical.length === 0
          if (Array.isArray(modelResult.issues)) {
            issues = [...new Set([...issues, ...modelResult.issues])]
          }
          if (!ok && modelResult.fix_hint) {
            fix_hint = modelResult.fix_hint
          }
        }
      } catch {
        ok = critical.length === 0
      }
    }

    res.json({
      ok,
      issues,
      critical,
      warnings,
      needs_fix: critical.length > 0,
      fix_hint: ok ? '' : fix_hint || buildPublishFixHint(critical),
      content_width: measured.content_width,
      content_height: measured.content_height,
      category: heuristic.category,
    })
  } catch (err) {
    next(err)
  }
}

function applySpecPatches(spec, patches) {
  if (!patches || !Object.keys(patches).length) {
    return spec
  }
  return { ...spec, ...patches }
}

async function augmentSpecWithSizing(spec) {
  const store = await getLearningStore()
  const category = deriveCategory(spec)
  const cal = getSizeCalibration(store, category)

  if (!cal) {
    return spec
  }

  const design = spec.design && typeof spec.design === 'object' ? { ...spec.design } : { style_source: 'auto' }
  const sizeNote = `Target compact content area ≈ ${cal.content_width}×${cal.content_height}px; avoid excess whitespace.`

  design.ux_notes = design.ux_notes ? `${design.ux_notes} ${sizeNote}` : sizeNote

  return { ...spec, design }
}

async function runSpecModelVerify(spec, issues) {
  const provider = getDefaultInterpreterProvider()

  const result = await callModel({
    role: 'verifier-spec',
    provider: provider.provider,
    model: provider.model,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    messages: [
      { role: 'system', content: VERIFIER_SPEC_PROMPT },
      {
        role: 'user',
        content: `ISSUES:\n${issues.map((i) => `- ${i}`).join('\n')}\n\nSPEC:\n${JSON.stringify(spec, null, 2)}`,
      },
    ],
  })

  return enrichSpecDesign(parseSpec(result, 'Verifier'))
}

async function runPublishModelVerify(spec, html, measured, issues) {
  const provider = getDefaultInterpreterProvider()
  const excerpt = html.length > 12000 ? `${html.slice(0, 12000)}\n<!-- truncated -->` : html

  const result = await callModel({
    role: 'verifier-publish',
    provider: provider.provider,
    model: provider.model,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    messages: [
      { role: 'system', content: VERIFIER_PUBLISH_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          spec,
          measured,
          issues,
          html_excerpt: excerpt,
        }),
      },
    ],
  })

  try {
    return JSON.parse(String(result).trim())
  } catch {
    return null
  }
}
