const _ = require('lodash');
const materials = require('../data/materials');
const lightingPresets = require('../data/lightingPresets');
const { renderParamTemplates } = require('../data/renderParams');

const MAX_RENDER_LOAD_THRESHOLD = 80;

const BASELINE_PARAMS = {
  resolution: { width: 1920, height: 1080 },
  samples: 256,
  maxBounces: 4,
  motionBlur: false,
  depthOfField: false,
  sceneSize: 100
};

function calculateDynamicLoadMultiplier(renderParams, sceneInfo) {
  const res = renderParams.resolution || BASELINE_PARAMS.resolution;
  const baselineArea = BASELINE_PARAMS.resolution.width * BASELINE_PARAMS.resolution.height;
  const currentArea = res.width * res.height;
  const areaRatio = currentArea / baselineArea;

  const samplesRatio = (renderParams.samples || BASELINE_PARAMS.samples) / BASELINE_PARAMS.samples;
  const bouncesRatio = (renderParams.maxBounces || BASELINE_PARAMS.maxBounces) / BASELINE_PARAMS.maxBounces;

  let motionBlurFactor = 1;
  if (renderParams.motionBlur) {
    motionBlurFactor = 1.4;
  }

  let dofFactor = 1;
  if (renderParams.depthOfField) {
    dofFactor = 1.35;
  }

  const sceneSize = sceneInfo && sceneInfo.sceneSize ? sceneInfo.sceneSize : BASELINE_PARAMS.sceneSize;
  const sizeRatio = sceneSize / BASELINE_PARAMS.sceneSize;
  const sceneSizeFactor = Math.pow(sizeRatio, 0.7);

  const multiplier = areaRatio * samplesRatio * bouncesRatio * motionBlurFactor * dofFactor * sceneSizeFactor;

  return {
    multiplier,
    breakdown: {
      areaRatio,
      samplesRatio,
      bouncesRatio,
      motionBlurFactor,
      dofFactor,
      sceneSizeFactor
    }
  };
}

function calculateMaterialScore(material, sceneInfo, renderParams, dynamicMultiplier) {
  let score = 0;
  let reasons = [];
  const multiplier = (dynamicMultiplier && dynamicMultiplier.multiplier) || 1;

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
    if (material.type === 'grass' || material.type === 'water' || material.type === 'concrete') {
      if (sceneInfo.sceneSize > 500) {
        score -= 20;
        reasons.push('大场景材质渲染压力');
      }
      if (sceneInfo.sceneSize > 2000) {
        score -= 30;
        reasons.push('超大场景重负载');
      }
    }
  }

  const effectiveLoad = material.renderLoad * multiplier;
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

function calculateLightingScore(lighting, sceneInfo, renderParams, dynamicMultiplier) {
  let score = 0;
  let reasons = [];
  const multiplier = (dynamicMultiplier && dynamicMultiplier.multiplier) || 1;

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

  if (sceneInfo.sceneSize) {
    if (sceneInfo.sceneSize > 1000 && lightCount > 3) {
      score -= 25;
      reasons.push('大场景多光源开销大');
    }
    if (sceneInfo.sceneSize > 3000) {
      score -= 20;
      reasons.push('超大场景光照采样压力');
    }
  }

  const effectiveLoad = lighting.renderLoad * multiplier;
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
  const dynamicMultiplier = calculateDynamicLoadMultiplier(renderParams, sceneInfo);

  const materialResults = materials
    .map(m => calculateMaterialScore(m, sceneInfo, renderParams, dynamicMultiplier))
    .filter(r => r.isRecommended)
    .sort((a, b) => b.score - a.score);

  const lightingResults = lightingPresets
    .map(l => calculateLightingScore(l, sceneInfo, renderParams, dynamicMultiplier))
    .filter(r => r.isRecommended)
    .sort((a, b) => b.score - a.score);

  const rejectedMaterials = materials
    .map(m => calculateMaterialScore(m, sceneInfo, renderParams, dynamicMultiplier))
    .filter(r => !r.isRecommended);

  const rejectedLighting = lightingPresets
    .map(l => calculateLightingScore(l, sceneInfo, renderParams, dynamicMultiplier))
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
    loadMultiplierInfo: dynamicMultiplier,
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
    } else if (sceneInfo.sceneSize > 3000) {
      warnings.push(`超大场景警告：当前 ${sceneInfo.sceneSize}㎡，几何与纹理开销剧增，建议精简材质或降低精度参数`);
    } else if (sceneInfo.sceneSize > 1000) {
      warnings.push(`大场景提示：当前 ${sceneInfo.sceneSize}㎡，渲染负载明显上升，注意观察推荐方案剔除情况`);
    } else if (sceneInfo.sceneSize > 500) {
      warnings.push(`场景尺寸较大：当前 ${sceneInfo.sceneSize}㎡，建议结合负载情况选择材质`);
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

  if (!!oldParams.motionBlur !== !!newParams.motionBlur) {
    changes.push('运动模糊');
  }

  if (!!oldParams.depthOfField !== !!newParams.depthOfField) {
    changes.push('景深效果');
  }

  const qualityChanged = changes.length > 0;

  if (qualityChanged) {
    const oldMult = calculateDynamicLoadMultiplier(oldParams, sceneInfo).multiplier;
    const newMult = calculateDynamicLoadMultiplier(newParams, sceneInfo).multiplier;

    const loadMultiplier = newMult / oldMult;

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
  calculateDynamicLoadMultiplier,
  MAX_RENDER_LOAD_THRESHOLD
};
