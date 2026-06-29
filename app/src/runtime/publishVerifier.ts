const MEASURE_TYPE = 'praxis-verify-measure'

function buildFastMeasureScript() {
  return `<script>(function(){var T=${JSON.stringify(MEASURE_TYPE)};function post(w,h){if(w>40&&h>40)parent.postMessage({type:T,width:w,height:h},'*')}function measure(){try{var b=document.body;if(!b)return;var w=Math.max(b.scrollWidth,b.offsetWidth);var h=Math.max(b.scrollHeight,b.offsetHeight);post(Math.ceil(w+24),Math.ceil(h+24))}catch(e){}}function run(){measure();setTimeout(measure,80);setTimeout(measure,220)}if(document.readyState==='complete')run();else window.addEventListener('load',run)})();</script>`
}

/** Fast pre-publish measure — shorter waits than the live window measure script. */
export function measureHtmlContent(html: string, timeoutMs = 2200): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText =
      'position:fixed;left:-10000px;top:0;width:800px;height:600px;visibility:hidden;pointer-events:none;border:0'
    iframe.sandbox = 'allow-scripts allow-same-origin'

    const cleanup = () => {
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      iframe.remove()
    }

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; width?: number; height?: number }
      if (data?.type !== MEASURE_TYPE) {
        return
      }
      if (typeof data.width === 'number' && typeof data.height === 'number') {
        cleanup()
        resolve({ width: data.width, height: data.height })
      }
    }

    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('Pre-publish measure timed out.'))
    }, timeoutMs)

    window.addEventListener('message', onMessage)
    document.body.appendChild(iframe)

    const script = buildFastMeasureScript()
    const doc = html.includes('</body>') ? html.replace('</body>', `${script}</body>`) : `${html}${script}`
    iframe.srcdoc = doc
  })
}
