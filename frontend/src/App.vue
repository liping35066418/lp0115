<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">
          <el-icon><Cpu /></el-icon>
          3D 渲染参数 AI 推演系统
        </h1>
        <span class="header-subtitle">参数配置界面 · 端口 3915</span>
      </div>
      <div class="header-right">
        <el-tag :type="engineStatus === 'online' ? 'success' : 'danger'" effect="dark">
          <el-icon><Monitor /></el-icon>
          推演引擎 (8915): {{ engineStatus === 'online' ? '在线' : '离线' }}
        </el-tag>
        <el-tag v-if="healthInfo" type="info" effect="plain">
          材质 {{ healthInfo.materialsCount }} | 光照 {{ healthInfo.lightingPresetsCount }}
        </el-tag>
      </div>
    </header>

    <main class="app-main">
      <el-row :gutter="20">
        <el-col :span="8">
          <SceneInput @change="onSceneChange" />

          <RenderParams
            :scene-info="sceneInfo"
            @change="onRenderParamsChange"
          />

          <div class="action-area">
            <el-button
              type="primary"
              size="large"
              :loading="recommendLoading"
              @click="fetchRecommendation"
              style="width: 100%"
            >
              <el-icon><MagicStick /></el-icon>
              获取AI推荐
            </el-button>
          </div>

          <QuickTest />
        </el-col>

        <el-col :span="16">
          <RecommendResult
            :result="recommendResult"
            :loading="recommendLoading"
          />
        </el-col>
      </el-row>

      <el-divider content-position="left">组件兼容性检测</el-divider>
      <ComponentCompatibilityCheck />
    </main>

    <footer class="app-footer">
      <span>仅输入场景属性即可校验推荐逻辑，无需音视频采集硬件，无成本收益计算</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { checkHealth, recommendParams } from './api'
import SceneInput from './components/SceneInput.vue'
import RenderParams from './components/RenderParams.vue'
import RecommendResult from './components/RecommendResult.vue'
import QuickTest from './components/QuickTest.vue'
import ComponentCompatibilityCheck from './components/ComponentCompatibilityCheck.vue'

const sceneInfo = ref({})
const renderParams = ref({})
const recommendResult = ref(null)
const recommendLoading = ref(false)
const engineStatus = ref('offline')
const healthInfo = ref(null)

onMounted(async () => {
  try {
    const res = await checkHealth()
    engineStatus.value = res.status === 'ok' ? 'online' : 'offline'
    healthInfo.value = res
  } catch (e) {
    engineStatus.value = 'offline'
  }
})

function onSceneChange(info) {
  sceneInfo.value = info
}

function onRenderParamsChange(params, needsRescreen) {
  renderParams.value = params
  if (needsRescreen && recommendResult.value) {
    fetchRecommendation()
  }
}

async function fetchRecommendation() {
  if (!sceneInfo.value.environment || !sceneInfo.value.style) {
    return
  }
  recommendLoading.value = true
  try {
    const res = await recommendParams(sceneInfo.value, renderParams.value)
    recommendResult.value = res
  } catch (e) {
    console.error('推荐请求失败', e)
    recommendResult.value = null
  } finally {
    recommendLoading.value = false
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f0f2f5;
  color: #303133;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-main {
  flex: 1;
  padding: 24px 32px;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
}

.action-area {
  margin-bottom: 20px;
}

.app-footer {
  text-align: center;
  padding: 12px;
  color: #909399;
  font-size: 12px;
  border-top: 1px solid #e4e7ed;
  background: #fff;
}
</style>
