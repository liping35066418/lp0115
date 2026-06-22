<template>
  <div class="quick-test">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Cpu /></el-icon>
          <span>快速校验推荐逻辑</span>
          <el-tag type="info" size="small">无需音视频采集硬件</el-tag>
        </div>
      </template>

      <el-button
        type="primary"
        :loading="loading"
        @click="runTest"
        style="margin-bottom: 16px"
      >
        <el-icon><VideoPlay /></el-icon>
        运行校验
      </el-button>

      <div v-if="testResults" class="test-results">
        <el-alert
          :title="testResults.message"
          type="success"
          show-icon
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-table :data="testResults.testResults" stripe border>
          <el-table-column label="场景" width="220">
            <template #default="{ row }">
              <el-tag size="small">{{ envLabel(row.scenario.environment) }}</el-tag>
              <el-tag size="small" type="warning" style="margin-left: 4px">{{ styleLabel(row.scenario.style) }}</el-tag>
              <span style="margin-left: 6px; font-size: 12px; color: #909399">{{ row.scenario.sceneSize }}m²</span>
            </template>
          </el-table-column>
          <el-table-column prop="recommendedCount" label="推荐组合数" width="120" align="center" />
          <el-table-column prop="topScore" label="最高评分" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.topScore > 100 ? 'success' : 'warning'" size="small">
                {{ row.topScore }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="avgLoad" label="平均负载" align="center">
            <template #default="{ row }">
              <el-tag :type="Number(row.avgLoad) > 80 ? 'danger' : 'success'" size="small">
                {{ row.avgLoad }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { quickTest } from '../api'

const loading = ref(false)
const testResults = ref(null)

async function runTest() {
  loading.value = true
  try {
    const res = await quickTest()
    testResults.value = res
  } catch (e) {
    console.error('快速校验失败', e)
  } finally {
    loading.value = false
  }
}

function envLabel(env) {
  return env === 'indoor' ? '室内' : '户外'
}

function styleLabel(style) {
  return style === 'realistic' ? '写实' : '卡通'
}
</script>

<style scoped>
.quick-test {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}
.test-results {
  margin-top: 8px;
}
</style>
