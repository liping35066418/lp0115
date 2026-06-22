<template>
  <div class="render-params">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>渲染精度参数</span>
          <el-tag v-if="rescreenInfo" :type="rescreenInfo.needsRescreen ? 'danger' : 'success'" size="small" style="margin-left: auto">
            {{ rescreenInfo.needsRescreen ? '参数变更需重新筛选' : '参数变更无需重筛' }}
          </el-tag>
        </div>
      </template>

      <el-form :model="formData" label-width="100px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分辨率宽度">
              <el-input-number
                v-model="formData.resolution.width"
                :min="320"
                :max="7680"
                :step="160"
                @change="onParamChange"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分辨率高度">
              <el-input-number
                v-model="formData.resolution.height"
                :min="240"
                :max="4320"
                :step="90"
                @change="onParamChange"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采样数 (Samples)">
              <el-slider
                v-model="formData.samples"
                :min="16"
                :max="2048"
                :step="16"
                show-input
                :show-input-controls="false"
                @change="onParamChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="光线反弹次数">
              <el-slider
                v-model="formData.maxBounces"
                :min="1"
                :max="16"
                :step="1"
                show-input
                :show-input-controls="false"
                @change="onParamChange"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运动模糊">
              <el-switch v-model="formData.motionBlur" @change="onParamChange" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="景深效果">
              <el-switch v-model="formData.depthOfField" @change="onParamChange" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="rescreenInfo && rescreenInfo.needsRescreen">
          <el-col :span="24">
            <el-alert
              :title="'变更项: ' + rescreenInfo.changes.join(', ') + ' | 预估负载变化: ' + rescreenInfo.estimatedLoadChange"
              type="warning"
              show-icon
              :closable="false"
            />
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { rescreenParams } from '../api'

const emit = defineEmits(['change'])

const props = defineProps({
  sceneInfo: {
    type: Object,
    default: () => ({})
  }
})

const formData = reactive({
  resolution: { width: 1920, height: 1080 },
  samples: 256,
  maxBounces: 4,
  motionBlur: false,
  depthOfField: false
})

const rescreenInfo = ref(null)
let oldParamsSnapshot = { ...formData, resolution: { ...formData.resolution } }

onMounted(() => {
  emit('change', { ...formData })
})

async function onParamChange() {
  try {
    const res = await rescreenParams(
      oldParamsSnapshot,
      { ...formData },
      props.sceneInfo
    )
    rescreenInfo.value = res.changeAnalysis || res
    oldParamsSnapshot = { ...formData, resolution: { ...formData.resolution } }
    emit('change', { ...formData }, rescreenInfo.value.needsRescreen)
  } catch (e) {
    console.error('重筛检查失败', e)
    emit('change', { ...formData }, true)
  }
}
</script>

<style scoped>
.render-params {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}
</style>
