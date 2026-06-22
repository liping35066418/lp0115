<template>
  <div class="compatibility-check">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Warning /></el-icon>
          <span>组件兼容性检测</span>
          <el-tag type="info" size="small">参数校验 · 互斥检测</el-tag>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="section-title">
            <el-icon><Setting /></el-icon>
            组件传入参数
          </div>
          
          <div class="param-list">
            <div
              v-for="(param, index) in params"
              :key="param.id"
              class="param-item"
            >
              <div class="param-header">
                <span class="param-name">{{ param.name }}</span>
                <el-tag size="small" type="info">{{ param.description }}</el-tag>
              </div>
              
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-select
                    v-model="param.type"
                    placeholder="选择类型"
                    size="small"
                    @change="onParamChange(index)"
                  >
                    <el-option label="字符串" value="string" />
                    <el-option label="数字" value="number" />
                    <el-option label="布尔值" value="boolean" />
                  </el-select>
                </el-col>
                <el-col :span="12">
                  <el-input
                    v-model="param.value"
                    placeholder="输入参数值"
                    size="small"
                    @input="onParamChange(index)"
                  />
                </el-col>
                <el-col :span="4">
                  <el-button
                    size="small"
                    type="danger"
                    text
                    @click="removeParam(index)"
                  >
                    删除
                  </el-button>
                </el-col>
              </el-row>
              
              <div v-if="param.hasRange" class="range-info">
                <el-icon><InfoFilled /></el-icon>
                范围限制: {{ param.min }} ~ {{ param.max }}
              </div>
            </div>
          </div>

          <el-button type="primary" size="small" @click="addParam" style="margin-top: 10px">
            <el-icon><Plus /></el-icon>
            添加参数
          </el-button>

          <el-divider />

          <div class="section-title">
            <el-icon><Link /></el-icon>
            互斥关系声明
          </div>
          
          <div class="mutex-list">
            <div
              v-for="(mutex, index) in mutexRelations"
              :key="index"
              class="mutex-item"
            >
              <el-select
                v-model="mutex.param1"
                placeholder="参数1"
                size="small"
                style="width: 120px"
              >
                <el-option
                  v-for="p in params"
                  :key="p.id"
                  :label="p.name"
                  :value="p.id"
                />
              </el-select>
              <span class="mutex-label">↔ 互斥 ↔</span>
              <el-select
                v-model="mutex.param2"
                placeholder="参数2"
                size="small"
                style="width: 120px"
              >
                <el-option
                  v-for="p in params"
                  :key="p.id"
                  :label="p.name"
                  :value="p.id"
                />
              </el-select>
              <el-button
                size="small"
                type="danger"
                text
                @click="removeMutex(index)"
              >
                删除
              </el-button>
            </div>
          </div>

          <el-button type="primary" size="small" @click="addMutex" style="margin-top: 10px">
            <el-icon><Plus /></el-icon>
            添加互斥
          </el-button>

          <el-divider />

          <el-button type="success" size="large" @click="runCheck" style="width: 100%">
            <el-icon><Search /></el-icon>
            开始检测
          </el-button>
        </el-col>

        <el-col :span="12">
          <div class="section-title">
            <el-icon><DataAnalysis /></el-icon>
            检测结果
          </div>

          <div v-if="!checkResult" class="empty-result">
            <el-empty description="请配置参数后点击「开始检测」" />
          </div>

          <div v-else class="result-content">
            <div class="result-summary">
              <div class="summary-item">
                <span class="summary-label">总问题数</span>
                <span class="summary-value" :class="{ danger: totalErrors > 0 }">
                  {{ totalErrors }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">兼容状态</span>
                <el-tag :type="totalErrors === 0 ? 'success' : 'danger'" size="small">
                  {{ totalErrors === 0 ? '完全兼容' : '存在问题' }}
                </el-tag>
              </div>
            </div>

            <el-divider content-position="left">模块分段标注</el-divider>

            <el-collapse v-model="activeModules">
              <el-collapse-item
                v-for="module in checkResult.modules"
                :key="module.id"
                :name="module.id"
              >
                <template #title>
                  <div class="module-title">
                    <el-icon class="module-icon" :class="module.status">
                      <component :is="module.status === 'error' ? 'CircleClose' : 'CircleCheck'" />
                    </el-icon>
                    <span>{{ module.name }}</span>
                    <el-tag
                      v-if="module.errors.length > 0"
                      type="danger"
                      size="small"
                      class="module-error-count"
                    >
                      {{ module.errors.length }} 个问题
                    </el-tag>
                    <el-tag
                      v-else
                      type="success"
                      size="small"
                      class="module-error-count"
                    >
                      正常
                    </el-tag>
                  </div>
                </template>

                <div v-if="module.errors.length > 0" class="error-list">
                  <div
                    v-for="(error, idx) in module.errors"
                    :key="idx"
                    class="error-item"
                  >
                    <el-icon class="error-icon"><Warning /></el-icon>
                    <div class="error-content">
                      <div class="error-title">{{ error.title }}</div>
                      <div class="error-desc">{{ error.description }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="no-error">
                  <el-icon><CircleCheck /></el-icon>
                  <span>该模块检测通过，无兼容性问题</span>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Warning,
  Setting,
  InfoFilled,
  Link,
  Plus,
  Search,
  DataAnalysis,
  CircleClose,
  CircleCheck
} from '@element-plus/icons-vue'

let paramIdCounter = 0

const params = ref([
  {
    id: `param_${++paramIdCounter}`,
    name: '采样数',
    description: '渲染采样参数',
    type: 'string',
    value: '',
    hasRange: true,
    min: 16,
    max: 2048
  },
  {
    id: `param_${++paramIdCounter}`,
    name: '光线反弹次数',
    description: '全局光照参数',
    type: 'string',
    value: '',
    hasRange: true,
    min: 1,
    max: 16
  },
  {
    id: `param_${++paramIdCounter}`,
    name: '模型路径',
    description: '资源引用参数',
    type: 'string',
    value: '',
    hasRange: false
  }
])

const mutexRelations = ref([
  { param1: 'param_1', param2: 'param_3' }
])

const checkResult = ref(null)
const activeModules = ref([])

const totalErrors = computed(() => {
  if (!checkResult.value) return 0
  return checkResult.value.modules.reduce((sum, m) => sum + m.errors.length, 0)
})

function addParam() {
  const newId = `param_${++paramIdCounter}`
  params.value.push({
    id: newId,
    name: `参数${params.value.length + 1}`,
    description: '自定义参数',
    type: 'string',
    value: '',
    hasRange: false
  })
}

function removeParam(index) {
  const paramId = params.value[index].id
  params.value.splice(index, 1)
  mutexRelations.value = mutexRelations.value.filter(
    m => m.param1 !== paramId && m.param2 !== paramId
  )
}

function addMutex() {
  mutexRelations.value.push({ param1: '', param2: '' })
}

function removeMutex(index) {
  mutexRelations.value.splice(index, 1)
}

function onParamChange() {
}

function convertValue(value, type) {
  if (type === 'number') {
    const num = Number(value)
    return isNaN(num) ? null : num
  }
  if (type === 'boolean') {
    if (value === 'true' || value === 'false') {
      return value === 'true'
    }
    return null
  }
  return value
}

function validateParam(param) {
  const errors = []
  const convertedValue = convertValue(param.value, param.type)

  if (param.value === '' || param.value === null || param.value === undefined) {
    return errors
  }

  if (param.type === 'number') {
    if (convertedValue === null) {
      errors.push({
        title: `参数「${param.name}」类型错误`,
        description: `值「${param.value}」无法转换为数字类型`
      })
      return errors
    }

    if (param.hasRange) {
      if (convertedValue > param.max) {
        errors.push({
          title: `参数「${param.name}」大于最大值`,
          description: `当前值 ${convertedValue} 超过最大值 ${param.max}`
        })
      }
      if (convertedValue < param.min) {
        errors.push({
          title: `参数「${param.name}」小于最小值`,
          description: `当前值 ${convertedValue} 低于最小值 ${param.min}`
        })
      }
    }
  }

  if (param.type === 'boolean') {
    if (convertedValue === null) {
      errors.push({
        title: `参数「${param.name}」类型错误`,
        description: `布尔值只能是 true 或 false，当前值：${param.value}`
      })
    }
  }

  return errors
}

function checkMutexRelations() {
  const errors = []
  const seenPairs = new Set()

  for (const mutex of mutexRelations.value) {
    if (!mutex.param1 || !mutex.param2) continue
    if (mutex.param1 === mutex.param2) continue

    const param1 = params.value.find(p => p.id === mutex.param1)
    const param2 = params.value.find(p => p.id === mutex.param2)

    if (!param1 || !param2) continue
    if (param1.value === '' || param2.value === '') continue

    const sortedIds = [mutex.param1, mutex.param2].sort().join('_')
    if (seenPairs.has(sortedIds)) continue
    seenPairs.add(sortedIds)

    errors.push({
      title: `互斥冲突：${param1.name} ↔ ${param2.name}`,
      description: `参数「${param1.name}」和「${param2.name}」存在互斥关系，不能同时传入`
    })
  }

  return errors
}

function runCheck() {
  const paramErrors = []
  for (const param of params.value) {
    paramErrors.push(...validateParam(param))
  }

  const mutexErrors = checkMutexRelations()

  const modules = [
    {
      id: 'param_validation',
      name: '参数类型与范围校验',
      status: paramErrors.length > 0 ? 'error' : 'success',
      errors: paramErrors
    },
    {
      id: 'mutex_check',
      name: '互斥关系检测',
      status: mutexErrors.length > 0 ? 'error' : 'success',
      errors: mutexErrors
    }
  ]

  checkResult.value = { modules }

  const errorModuleIds = modules
    .filter(m => m.errors.length > 0)
    .map(m => m.id)

  activeModules.value = [...errorModuleIds]
}
</script>

<style scoped>
.compatibility-check {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.param-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px;
}

.param-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.param-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.range-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.mutex-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mutex-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mutex-label {
  font-size: 12px;
  color: #909399;
}

.empty-result {
  padding: 40px 0;
}

.result-content {
  min-height: 400px;
}

.result-summary {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #67c23a;
}

.summary-value.danger {
  color: #f56c6c;
}

.module-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.module-icon {
  font-size: 16px;
}

.module-icon.error {
  color: #f56c6c;
}

.module-icon.success {
  color: #67c23a;
}

.module-error-count {
  margin-left: auto;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-item {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #fef0f0;
  border-radius: 6px;
  border-left: 3px solid #f56c6c;
}

.error-icon {
  color: #f56c6c;
  margin-top: 2px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 13px;
  font-weight: 500;
  color: #f56c6c;
  margin-bottom: 4px;
}

.error-desc {
  font-size: 12px;
  color: #909399;
}

.no-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px;
  color: #67c23a;
  font-size: 13px;
}
</style>
