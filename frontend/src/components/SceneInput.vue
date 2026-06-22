<template>
  <div class="scene-input">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><PictureFilled /></el-icon>
          <span>场景基础信息</span>
        </div>
      </template>

      <el-form :model="formData" label-width="100px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场景环境">
              <el-radio-group v-model="formData.environment" @change="emitChange">
                <el-radio-button label="indoor">
                  <el-icon><House /></el-icon>
                  室内
                </el-radio-button>
                <el-radio-button label="outdoor">
                  <el-icon><Sunny /></el-icon>
                  户外
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场景风格">
              <el-radio-group v-model="formData.style" @change="emitChange">
                <el-radio-button label="realistic">
                  <el-icon><Camera /></el-icon>
                  写实
                </el-radio-button>
                <el-radio-button label="cartoon">
                  <el-icon><Brush /></el-icon>
                  卡通
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="场景尺寸（平方米）">
              <el-slider
                v-model="formData.sceneSize"
                :min="10"
                :max="5000"
                :step="10"
                show-input
                :show-input-controls="false"
                @change="emitChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渲染质量">
              <el-select v-model="formData.renderQuality" @change="emitChange" style="width: 100%">
                <el-option
                  v-for="t in renderTemplates"
                  :key="t.id"
                  :label="t.name + ' - ' + t.description"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="validation">
          <el-col :span="24">
            <el-alert
              v-if="!validation.isValid"
              :title="validation.errors.join('; ')"
              type="error"
              show-icon
              :closable="false"
            />
            <el-alert
              v-if="validation.warnings.length > 0"
              :title="validation.warnings.join('; ')"
              type="warning"
              show-icon
              :closable="false"
              style="margin-top: 8px"
            />
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { validateScene, getRenderTemplates } from '../api'

const emit = defineEmits(['change'])

const formData = reactive({
  environment: 'indoor',
  style: 'realistic',
  sceneSize: 100,
  renderQuality: 'medium_quality'
})

const validation = ref(null)
const renderTemplates = ref([])

onMounted(async () => {
  try {
    const res = await getRenderTemplates()
    renderTemplates.value = res.data || []
  } catch (e) {
    console.error('获取渲染模板失败', e)
  }
})

async function emitChange() {
  try {
    const res = await validateScene({ ...formData })
    validation.value = res.validation
    if (res.validation.isValid) {
      emit('change', { ...formData })
    }
  } catch (e) {
    console.error('场景验证失败', e)
  }
}

emitChange()
</script>

<style scoped>
.scene-input {
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
