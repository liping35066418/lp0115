import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

export async function checkHealth() {
  const res = await api.get('/health')
  return res.data
}

export async function getMaterials(params = {}) {
  const res = await api.get('/materials', { params })
  return res.data
}

export async function getLightingPresets(params = {}) {
  const res = await api.get('/lighting-presets', { params })
  return res.data
}

export async function getRenderTemplates() {
  const res = await api.get('/render-templates')
  return res.data
}

export async function validateScene(sceneInfo) {
  const res = await api.post('/validate-scene', sceneInfo)
  return res.data
}

export async function recommendParams(sceneInfo, renderParams = {}) {
  const res = await api.post('/recommend-params', { sceneInfo, renderParams })
  return res.data
}

export async function rescreenParams(oldParams, newParams, sceneInfo) {
  const res = await api.post('/rescreen-params', { oldParams, newParams, sceneInfo })
  return res.data
}

export async function quickTest() {
  const res = await api.post('/quick-test')
  return res.data
}
