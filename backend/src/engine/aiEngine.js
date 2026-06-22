const _ = require('lodash');
const materials = require('../data/materials');
const lightingPresets = require('../data/lightingPresets');
const { renderParamTemplates } = require('../data/renderParams');

const MAX_RENDER_LOAD_THRESHOLD = 80;

function calculateMaterialScore(material, sceneInfo, renderParams) {
  let score = 0;
  let reasons = [];

  if (material.compatibleStyles.includes(sceneInfo.style)) {
    score += 40;
    reasons.push('风格匹配');
  } else {
    score -= 100;
    reasons.push('风格不匹配');
  }

  const envMatch = material.compatibleEnvironments.includes(sceneInfo.environment) ||
                   material.compatibleEnvironments.includes('both');
  if (envMatch) {
    score += 30;
    reasons.push('环境匹配');
  } else {
    score -= 100;
    reasons.push('环境不匹配');
  }

  if (sceneInfo.sceneSize) {
    const sizeFactor = Math.min(sceneInfo.sceneSize / 100, 1);
    if (material.type === 'grass' || material.type === 'water') {
      score += sizeFactor * 15;
      reasons.push('大场景适配');
    }
  }

  const effectiveLoad = material.renderLoad * (renderParams.renderLoadMultiplier || 1);
  if (effectiveLoad <= MAX_RENDER_LOAD_THRESHOLD) {
    score += 20;
    reasons.push('渲染负载合规');
  } else {
    score -= 50;
    reasons.push(`渲染负载过高(${effectiveLoad.toFixed(0)})`);
  }

  if (material.roughness >= 0.7) {
    score += 5;
    reasons.push('低反射优化');
  }

  if (!material.transparency || material.transparency < 0.5) {
    score += 5;
    reasons.push('无折射计算');
  }

  return {
    material,
    score,
    effectiveLoad,
    reasons,
    isRecommended: score > 50
  };
}

function calculateLightingScore(lighting, sceneInfo, renderParams) {
  let score = 0;
  let reasons = [];

  if (lighting.style === sceneInfo.style) {
    score += 40;
    reasons.push('风格匹配');
  } else {
    score -= 100;
    reasons.push('风格不匹配');
  }

  const envMatch = lighting.environment === sceneInfo.environment ||
                   lighting.environment === 'both';
  if (envMatch) {
    score += 35;
    reasons.push('环境匹配');
  } else {
    score -= 100;
    reasons.push('环境不匹配');
  }

  const lightCount = lighting.lightSources.length;
  if (lightCount <= 2) {
    score += 10;
    reasons.push('光源数量优化');
  }

  const effectiveLoad = lighting.renderLoad * (renderParams.renderLoadMultiplier || 1);
  if (effectiveLoad <= MAX_RENDER_LOAD_THRESHOLD) {
    score += 15;
    reasons.push('渲染负载合规');
  } else {
    score -= 50;
    reasons.push(`渲染负载过高(${effectiveLoad.toFixed(0)})`);
  }

  if (lighting.shadowSoftness >= 0.7) {
    score += 5;
    reasons.push('软阴影减少锯齿');
  }

  return {
    lighting,
    score,
    effectiveLoad,
    reasons,
    isRecommended: score > 50
  };
}

function generateParameterCombinations(sceneInfo, renderParams) {
  const materialResults = materials
    .map(m => calculateMaterialScore(m, sceneInfo, renderParams))
    .filter(r => r.isRecommended)
    .sort((a, b) => b.score - a.score);

  const lightingResults = lightingPresets
    .map(l => calculateLightingScore(l, sceneInfo, renderParams))
    .filter(r => r.isRecommended)
    .sort((a, b) => b.score - a.score);

  const rejectedMaterials = materials
    .map(m => calculateMaterialScore(m, sceneInfo, renderParams))
    .filter(r => !r.isRecommended);

  const rejectedLighting = lightingPresets
    .map(l => calculateLightingScore(l, sceneInfo, renderParams))
    .filter(r => !r.isRecommended);

  const combinations = [];
  const maxCombinations = Math.min(12, materialResults.length * lightingResults.length);
  
  for (let i = 0; i < Math.min(6, materialResults.length); i++) {
    for (let j = 0; j < Math.min(2, lightingResults.length); j++) {
      if (combinations.length >= maxCombinations) break;
      
      const matResult = materialResults[i];
      const lightResult = lightingResults[j];
      const totalLoad = matResult.effectiveLoad + lightResult.effectiveLoad;
      
      combinations.push({
        id: `combo_${Date.now()}_${i}_${j}`,
        material: matResult.material,
        lighting: lightResult.lighting,
        totalScore: matResult.score + lightResult.score,
        totalRenderLoad: totalLoad,
        materialScore: matResult.score,
        lightingScore: lightResult.score,
        reasons: [...matResult.reasons, ...lightResult.reasons],
        isOptimal: totalLoad <= MAX_RENDER_LOAD_THRESHOLD * 1.5
      });
    }
  }

  combinations.sort((a, b) => b.totalScore - a.totalScore);

  return {
    recommended: combinations.slice(0, 6),
    alternatives: combinations.slice(6),
    statistics: {
      totalMaterialsScanned: materials.length,
      totalLightingScanned: lightingPresets.length,
      materialsRecommended: materialResults.length,
      lightingRecommended: lightingResults.length,
      materialsRejected: rejectedMaterials.length,
      lightingRejected: rejectedLighting.length,
      combinationsGenerated: combinations.length,
      avgRenderLoad: combinations.length > 0 
        ? (combinations.reduce((sum, c) => sum + c.totalRenderLoad, 0) / combinations.length).toFixed(1)
        : 0
    },
    rejected: {
      materials: rejectedMaterials.map(r => ({
        material: r.material,
        reasons: r.reasons,
        effectiveLoad: r.effectiveLoad
      })),
      lighting: rejectedLighting.map(r => ({
        lighting: r.lighting,
        reasons: r.reasons,
        effectiveLoad: r.effectiveLoad
      }))
    }
  };
}

function validateSceneAttributes(sceneInfo) {
  const errors = [];
  const warnings = [];

  if (!sceneInfo.environment) {
    errors.push('请选择场景环境（室内/户外）');
  } else if (!['indoor', 'outdoor'].includes(sceneInfo.environment)) {
    errors.push('场景环境必须是 indoor 或 outdoor');
  }

  if (!sceneInfo.style) {
    errors.push('请选择场景风格（写实/卡通）');
  } else if (!['realistic', 'cartoon'].includes(sceneInfo.style)) {
    errors.push('场景风格必须是 realistic 或 cartoon');
  }

  if (sceneInfo.sceneSize !== undefined) {
    if (sceneInfo.sceneSize <= 0) {
      errors.push('场景尺寸必须大于0');
    } else if (sceneInfo.sceneSize > 10000) {
      warnings.push('场景尺寸过大，可能影响渲染性能');
    }
  }

  if (sceneInfo.renderQuality && !renderParamTemplates.find(t => t.id === sceneInfo.renderQuality)) {
    warnings.push('未知的渲染质量等级，使用默认值');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

function rescreenOnParamChange(oldParams, newParams, sceneInfo) {
  const changes = [];
  
  if (oldParams.resolution && newParams.resolution &&
      (oldParams.resolution.width !== newParams.resolution.width ||
       oldParams.resolution.height !== newParams.resolution.height)) {
    changes.push('分辨率');
  }
  
  if (oldParams.samples !== newParams.samples) {
    changes.push('采样数');
  }
  
  if (oldParams.maxBounces !== newParams.maxBounces) {
    changes.push('光线反弹次数');
  }
  
  const qualityChanged = changes.length > 0;
  
  if (qualityChanged) {
    const areaRatio = (newParams.resolution.width * newParams.resolution.height) / 
                      (oldParams.resolution.width * oldParams.resolution.height);
    const samplesRatio = newParams.samples / oldParams.samples;
    const bouncesRatio = newParams.maxBounces / oldParams.maxBounces;
    
    const loadMultiplier = areaRatio * samplesRatio * bouncesRatio;
    
    return {
      needsRescreen: true,
      changes,
      loadMultiplier,
      estimatedLoadChange: ((loadMultiplier - 1) * 100).toFixed(1) + '%'
    };
  }
  
  return {
    needsRescreen: false,
    changes: []
  };
}

module.exports = {
  calculateMaterialScore,
  calculateLightingScore,
  generateParameterCombinations,
  validateSceneAttributes,
  rescreenOnParamChange,
  MAX_RENDER_LOAD_THRESHOLD
};
