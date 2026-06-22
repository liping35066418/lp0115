const express = require('express');
const cors = require('cors');
const materials = require('./data/materials');
const lightingPresets = require('./data/lightingPresets');
const { renderParamTemplates, defaultRenderParams } = require('./data/renderParams');
const {
  generateParameterCombinations,
  validateSceneAttributes,
  rescreenOnParamChange,
  MAX_RENDER_LOAD_THRESHOLD
} = require('./engine/aiEngine');

const app = express();
const PORT = 8915;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '3D渲染参数AI推演引擎',
    port: PORT,
    timestamp: new Date().toISOString(),
    materialsCount: materials.length,
    lightingPresetsCount: lightingPresets.length
  });
});

app.get('/api/materials', (req, res) => {
  const { style, environment } = req.query;
  
  let filtered = materials;
  
  if (style) {
    filtered = filtered.filter(m => m.compatibleStyles.includes(style));
  }
  if (environment) {
    filtered = filtered.filter(m => 
      m.compatibleEnvironments.includes(environment) || 
      m.compatibleEnvironments.includes('both')
    );
  }
  
  res.json({
    total: filtered.length,
    data: filtered
  });
});

app.get('/api/lighting-presets', (req, res) => {
  const { style, environment } = req.query;
  
  let filtered = lightingPresets;
  
  if (style) {
    filtered = filtered.filter(l => l.style === style || l.style === 'both');
  }
  if (environment) {
    filtered = filtered.filter(l => 
      l.environment === environment || 
      l.environment === 'both'
    );
  }
  
  res.json({
    total: filtered.length,
    data: filtered
  });
});

app.get('/api/render-templates', (req, res) => {
  res.json({
    total: renderParamTemplates.length,
    defaultParams: defaultRenderParams,
    data: renderParamTemplates
  });
});

app.post('/api/validate-scene', (req, res) => {
  const sceneInfo = req.body;
  const validation = validateSceneAttributes(sceneInfo);
  
  res.json({
    validation,
    sceneInfo
  });
});

app.post('/api/recommend-params', (req, res) => {
  const { sceneInfo, renderParams } = req.body;
  
  const validation = validateSceneAttributes(sceneInfo);
  
  if (!validation.isValid) {
    return res.status(400).json({
      error: '场景信息验证失败',
      validation,
      sceneInfo
    });
  }
  
  const qualityTemplate = sceneInfo.renderQuality 
    ? renderParamTemplates.find(t => t.id === sceneInfo.renderQuality)
    : renderParamTemplates[1];
  
  const effectiveRenderParams = {
    ...defaultRenderParams,
    ...qualityTemplate,
    ...renderParams
  };
  
  const startTime = Date.now();
  const result = generateParameterCombinations(sceneInfo, effectiveRenderParams);
  const endTime = Date.now();
  
  res.json({
    success: true,
    processingTime: endTime - startTime + 'ms',
    timestamp: new Date().toISOString(),
    maxRenderLoadThreshold: MAX_RENDER_LOAD_THRESHOLD,
    sceneInfo,
    renderParams: effectiveRenderParams,
    validation,
    ...result
  });
});

app.post('/api/rescreen-params', (req, res) => {
  const { oldParams, newParams, sceneInfo } = req.body;
  
  const changeAnalysis = rescreenOnParamChange(oldParams, newParams, sceneInfo);
  
  if (changeAnalysis.needsRescreen) {
    const qualityTemplate = sceneInfo.renderQuality 
      ? renderParamTemplates.find(t => t.id === sceneInfo.renderQuality)
      : renderParamTemplates[1];
    
    const effectiveRenderParams = {
      ...defaultRenderParams,
      ...qualityTemplate,
      ...newParams
    };
    
    const startTime = Date.now();
    const result = generateParameterCombinations(sceneInfo, effectiveRenderParams);
    const endTime = Date.now();
    
    res.json({
      success: true,
      rescreenTriggered: true,
      changeAnalysis,
      processingTime: endTime - startTime + 'ms',
      timestamp: new Date().toISOString(),
      sceneInfo,
      renderParams: effectiveRenderParams,
      ...result
    });
  } else {
    res.json({
      success: true,
      rescreenTriggered: false,
      changeAnalysis,
      message: '参数变化未触发重新筛选阈值'
    });
  }
});

app.post('/api/quick-test', (req, res) => {
  const testScenarios = [
    { environment: 'indoor', style: 'realistic', sceneSize: 50 },
    { environment: 'indoor', style: 'cartoon', sceneSize: 30 },
    { environment: 'outdoor', style: 'realistic', sceneSize: 200 },
    { environment: 'outdoor', style: 'cartoon', sceneSize: 100 }
  ];
  
  const results = testScenarios.map(scenario => {
    const qualityTemplate = renderParamTemplates[1];
    const result = generateParameterCombinations(scenario, qualityTemplate);
    
    return {
      scenario,
      recommendedCount: result.recommended.length,
      topScore: result.recommended[0]?.totalScore || 0,
      avgLoad: result.statistics.avgRenderLoad
    };
  });
  
  res.json({
    success: true,
    message: '快速校验推荐逻辑完成',
    testResults: results,
    note: '无需音视频采集硬件，纯属性参数校验'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   3D渲染参数AI推演引擎已启动                             ║
  ║                                                          ║
  ║   端口: ${PORT}                                           ║
  ║   材质库: ${materials.length} 种材质                      ║
  ║   光照预设: ${lightingPresets.length} 种方案              ║
  ║                                                          ║
  ║   API 端点:                                              ║
  ║   GET  /api/health                - 健康检查              ║
  ║   GET  /api/materials             - 材质列表              ║
  ║   GET  /api/lighting-presets      - 光照预设              ║
  ║   GET  /api/render-templates      - 渲染模板              ║
  ║   POST /api/validate-scene        - 场景验证              ║
  ║   POST /api/recommend-params      - 参数推荐              ║
  ║   POST /api/rescreen-params       - 参数变更重筛          ║
  ║   POST /api/quick-test            - 快速逻辑校验          ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});
