import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

const root = resolve(import.meta.dirname, '../out')
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

createServer(async (request, response) => {
  let pathname
  try {
    pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname
    )
  } catch {
    response.writeHead(400).end('Bad request')
    return
  }

  const filePath = resolve(
    root,
    `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`
  )
  if (!filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden')
    return
  }

  try {
    const content = await readFile(filePath)
    response.writeHead(200, {
      'Content-Type': mime[extname(filePath)] ?? 'application/octet-stream',
    })
    response.end(content)
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error
    response.writeHead(404).end('Not found')
  }
}).listen(3000, '127.0.0.1', () => {
  console.log('Static playground preview: http://127.0.0.1:3000/')
})
