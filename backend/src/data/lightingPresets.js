const lightingPresets = [
  {
    id: 'light_001',
    name: '室内自然光',
    environment: 'indoor',
    style: 'realistic',
    intensity: 0.8,
    colorTemperature: 5500,
    shadowSoftness: 0.6,
    ambientIntensity: 0.3,
    renderLoad: 45,
    lightSources: [
      { type: 'directional', intensity: 0.7, color: '#FFF8E7', angle: 45 },
      { type: 'point', intensity: 0.4, color: '#FFE4B5', position: 'ceiling' }
    ],
    description: '模拟室内窗户射入的自然日光'
  },
  {
    id: 'light_002',
    name: '室内暖光',
    environment: 'indoor',
    style: 'realistic',
    intensity: 0.9,
    colorTemperature: 3200,
    shadowSoftness: 0.8,
    ambientIntensity: 0.5,
    renderLoad: 35,
    lightSources: [
      { type: 'point', intensity: 0.8, color: '#FFA500', position: 'corner' },
      { type: 'area', intensity: 0.3, color: '#FFEFD5', position: 'wall' }
    ],
    description: '温馨的室内暖色调灯光'
  },
  {
    id: 'light_003',
    name: '室内冷光',
    environment: 'indoor',
    style: 'realistic',
    intensity: 1.0,
    colorTemperature: 6500,
    shadowSoftness: 0.5,
    ambientIntensity: 0.4,
    renderLoad: 40,
    lightSources: [
      { type: 'area', intensity: 0.9, color: '#E0FFFF', position: 'ceiling' },
      { type: 'point', intensity: 0.2, color: '#ADD8E6', position: 'corner' }
    ],
    description: '现代简约冷色调办公照明'
  },
  {
    id: 'light_004',
    name: '户外正午',
    environment: 'outdoor',
    style: 'realistic',
    intensity: 1.5,
    colorTemperature: 5800,
    shadowSoftness: 0.2,
    ambientIntensity: 0.6,
    renderLoad: 55,
    lightSources: [
      { type: 'directional', intensity: 1.4, color: '#FFFFE0', angle: 85 },
      { type: 'hdri', intensity: 0.5, color: '#87CEEB' }
    ],
    description: '正午强烈阳光，阴影锐利'
  },
  {
    id: 'light_005',
    name: '户外黄昏',
    environment: 'outdoor',
    style: 'realistic',
    intensity: 0.7,
    colorTemperature: 2800,
    shadowSoftness: 0.9,
    ambientIntensity: 0.4,
    renderLoad: 60,
    lightSources: [
      { type: 'directional', intensity: 0.6, color: '#FF6347', angle: 10 },
      { type: 'hdri', intensity: 0.5, color: '#FFB6C1' }
    ],
    description: '日落时分温暖的黄昏光线'
  },
  {
    id: 'light_006',
    name: '户外阴天',
    environment: 'outdoor',
    style: 'realistic',
    intensity: 0.6,
    colorTemperature: 6000,
    shadowSoftness: 1.0,
    ambientIntensity: 0.8,
    renderLoad: 30,
    lightSources: [
      { type: 'directional', intensity: 0.3, color: '#D3D3D3', angle: 60 },
      { type: 'hdri', intensity: 0.7, color: '#B0C4DE' }
    ],
    description: '阴天柔和漫射光线，无明显阴影'
  },
  {
    id: 'light_007',
    name: '卡通柔和光',
    environment: 'both',
    style: 'cartoon',
    intensity: 1.0,
    colorTemperature: 5500,
    shadowSoftness: 0.8,
    ambientIntensity: 0.7,
    renderLoad: 12,
    lightSources: [
      { type: 'directional', intensity: 0.8, color: '#FFFFFF', angle: 45 },
      { type: 'hemisphere', intensity: 0.5, skyColor: '#87CEEB', groundColor: '#F5DEB3' }
    ],
    description: '卡通风格通用柔和光照'
  },
  {
    id: 'light_008',
    name: '卡通明亮光',
    environment: 'both',
    style: 'cartoon',
    intensity: 1.3,
    colorTemperature: 5200,
    shadowSoftness: 0.5,
    ambientIntensity: 0.8,
    renderLoad: 15,
    lightSources: [
      { type: 'directional', intensity: 1.1, color: '#FFFAF0', angle: 50 },
      { type: 'hemisphere', intensity: 0.6, skyColor: '#ADD8E6', groundColor: '#FFEFD5' }
    ],
    description: '明亮活泼的卡通光照效果'
  },
  {
    id: 'light_009',
    name: '卡通黄昏',
    environment: 'outdoor',
    style: 'cartoon',
    intensity: 0.9,
    colorTemperature: 3000,
    shadowSoftness: 0.9,
    ambientIntensity: 0.6,
    renderLoad: 18,
    lightSources: [
      { type: 'directional', intensity: 0.8, color: '#FF7F50', angle: 15 },
      { type: 'hemisphere', intensity: 0.5, skyColor: '#DDA0DD', groundColor: '#FFB6C1' }
    ],
    description: '卡通风格浪漫黄昏'
  },
  {
    id: 'light_010',
    name: '室内霓虹',
    environment: 'indoor',
    style: 'realistic',
    intensity: 0.8,
    colorTemperature: 4500,
    shadowSoftness: 0.7,
    ambientIntensity: 0.2,
    renderLoad: 75,
    lightSources: [
      { type: 'point', intensity: 0.6, color: '#FF00FF', position: 'left' },
      { type: 'point', intensity: 0.6, color: '#00FFFF', position: 'right' },
      { type: 'point', intensity: 0.4, color: '#FFFF00', position: 'center' }
    ],
    description: '赛博朋克风格多色霓虹灯光'
  },
  {
    id: 'light_011',
    name: '摄影棚三灯',
    environment: 'indoor',
    style: 'realistic',
    intensity: 1.2,
    colorTemperature: 5500,
    shadowSoftness: 0.4,
    ambientIntensity: 0.3,
    renderLoad: 65,
    lightSources: [
      { type: 'area', intensity: 1.0, color: '#FFFFFF', position: 'front' },
      { type: 'area', intensity: 0.5, color: '#FFF8DC', position: 'back_left' },
      { type: 'area', intensity: 0.3, color: '#E6E6FA', position: 'back_right' }
    ],
    description: '专业摄影棚三点布光'
  },
  {
    id: 'light_012',
    name: '卡通夜空',
    environment: 'outdoor',
    style: 'cartoon',
    intensity: 0.5,
    colorTemperature: 4000,
    shadowSoftness: 1.0,
    ambientIntensity: 0.4,
    renderLoad: 14,
    lightSources: [
      { type: 'directional', intensity: 0.4, color: '#F0E68C', angle: 60 },
      { type: 'hemisphere', intensity: 0.3, skyColor: '#191970', groundColor: '#2F4F4F' }
    ],
    description: '卡通风格月光夜景'
  }
];

module.exports = lightingPresets;
