const renderParamTemplates = [
  {
    id: 'low_quality',
    name: '快速预览',
    resolution: { width: 960, height: 540 },
    samples: 64,
    maxBounces: 2,
    motionBlur: false,
    depthOfField: false,
    renderLoadMultiplier: 0.3,
    description: '低分辨率快速预览，用于场景调整'
  },
  {
    id: 'medium_quality',
    name: '标准质量',
    resolution: { width: 1920, height: 1080 },
    samples: 256,
    maxBounces: 4,
    motionBlur: false,
    depthOfField: false,
    renderLoadMultiplier: 1.0,
    description: '平衡质量与速度，适合日常渲染'
  },
  {
    id: 'high_quality',
    name: '高质量',
    resolution: { width: 2560, height: 1440 },
    samples: 512,
    maxBounces: 6,
    motionBlur: true,
    depthOfField: true,
    renderLoadMultiplier: 2.5,
    description: '高质量输出，适合成品渲染'
  },
  {
    id: 'ultra_quality',
    name: '超高质量',
    resolution: { width: 3840, height: 2160 },
    samples: 1024,
    maxBounces: 8,
    motionBlur: true,
    depthOfField: true,
    renderLoadMultiplier: 5.0,
    description: '4K超高清，适合专业输出'
  }
];

const defaultRenderParams = {
  resolution: { width: 1920, height: 1080 },
  samples: 256,
  maxBounces: 4,
  motionBlur: false,
  depthOfField: false,
  adaptiveSampling: true,
  tileSize: 64,
  denoiser: 'openimageio',
  colorManagement: 'ACES'
};

module.exports = { renderParamTemplates, defaultRenderParams };
