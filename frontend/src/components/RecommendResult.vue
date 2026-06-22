<template>
  <div class="recommend-result">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><MagicStick /></el-icon>
          <span>AI 推荐方案</span>
          <el-tag v-if="result" type="info" size="small">
            处理耗时: {{ result.processingTime }}
          </el-tag>
        </div>
      </template>

      <div v-if="loading" class="loading-area">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="!result" class="empty-area">
        <el-empty description="请先配置场景信息，点击「获取AI推荐」" />
      </div>

      <div v-else>
        <el-row :gutter="16" class="stats-row">
          <el-col :span="6">
            <el-statistic title="扫描材质数" :value="result.statistics.totalMaterialsScanned" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="扫描光照预设" :value="result.statistics.totalLightingScanned" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="推荐组合" :value="result.statistics.combinationsGenerated" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="平均渲染负载" :value="result.statistics.avgRenderLoad" />
          </el-col>
        </el-row>

        <el-divider content-position="left">推荐方案 TOP {{ result.recommended.length }}</el-divider>

        <div class="combo-list">
          <el-card
            v-for="(combo, index) in result.recommended"
            :key="combo.id"
            shadow="hover"
            class="combo-card"
            :class="{ 'optimal': combo.isOptimal }"
          >
            <div class="combo-header">
              <el-tag :type="combo.isOptimal ? 'success' : 'primary'" effect="dark">
                #{{ index + 1 }}
              </el-tag>
              <span class="combo-score">综合评分: {{ combo.totalScore }}</span>
              <el-tag type="warning" size="small">负载: {{ combo.totalRenderLoad.toFixed(0) }}</el-tag>
              <el-tag v-if="combo.isOptimal" type="success" size="small">最优</el-tag>
            </div>

            <el-row :gutter="16" style="margin-top: 12px">
              <el-col :span="12">
                <div class="param-block">
                  <div class="param-label">
                    <el-icon><Box /></el-icon>
                    材质: {{ combo.material.name }}
                  </div>
                  <div class="param-detail">
                    <el-tag size="small">{{ combo.material.type }}</el-tag>
                    <span class="param-item">粗糙度: {{ combo.material.roughness }}</span>
                    <span class="param-item">金属度: {{ combo.material.metallic }}</span>
                    <span class="param-item">渲染负载: {{ combo.material.renderLoad }}</span>
                  </div>
                  <div class="color-preview">
                    <span>色值:</span>
                    <span class="color-dot" :style="{ backgroundColor: combo.material.color }"></span>
                    {{ combo.material.color }}
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="param-block">
                  <div class="param-label">
                    <el-icon><Sunny /></el-icon>
                    光照: {{ combo.lighting.name }}
                  </div>
                  <div class="param-detail">
                    <span class="param-item">强度: {{ combo.lighting.intensity }}</span>
                    <span class="param-item">色温: {{ combo.lighting.colorTemperature }}K</span>
                    <span class="param-item">渲染负载: {{ combo.lighting.renderLoad }}</span>
                  </div>
                  <div class="param-detail">
                    <span class="param-item">阴影柔和: {{ combo.lighting.shadowSoftness }}</span>
                    <span class="param-item">环境光: {{ combo.lighting.ambientIntensity }}</span>
                  </div>
                </div>
              </el-col>
            </el-row>

            <div class="reason-tags">
              <el-tag
                v-for="reason in combo.reasons"
                :key="reason"
                size="small"
                :type="getReasonType(reason)"
                effect="plain"
              >
                {{ reason }}
              </el-tag>
            </div>
          </el-card>
        </div>

        <el-divider v-if="result.rejected && (result.rejected.materials.length > 0 || result.rejected.lighting.length > 0)" content-position="left">
          已剔除方案 (负载过高/不匹配)
        </el-divider>

        <el-collapse v-if="result.rejected">
          <el-collapse-item
            v-if="result.rejected.materials.length > 0"
            :title="'剔除材质 (' + result.rejected.materials.length + ')'"
          >
            <el-table :data="result.rejected.materials" size="small" stripe>
              <el-table-column prop="material.name" label="材质" width="120" />
              <el-table-column prop="material.type" label="类型" width="100" />
              <el-table-column prop="effectiveLoad" label="有效负载" width="100">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.effectiveLoad.toFixed(0) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="剔除原因">
                <template #default="{ row }">
                  <el-tag v-for="r in row.reasons" :key="r" size="small" type="info" effect="plain" style="margin-right: 4px">{{ r }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
          <el-collapse-item
            v-if="result.rejected.lighting.length > 0"
            :title="'剔除光照 (' + result.rejected.lighting.length + ')'"
          >
            <el-table :data="result.rejected.lighting" size="small" stripe>
              <el-table-column prop="lighting.name" label="光照" width="140" />
              <el-table-column prop="effectiveLoad" label="有效负载" width="100">
                <template #default="{ row }">
                  <el-tag type="danger" size="small">{{ row.effectiveLoad.toFixed(0) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="剔除原因">
                <template #default="{ row }">
                  <el-tag v-for="r in row.reasons" :key="r" size="small" type="info" effect="plain" style="margin-right: 4px">{{ r }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>
  </div>
</template>

<script setup>
defineProps({
  result: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

function getReasonType(reason) {
  if (reason.includes('不匹配') || reason.includes('过高')) return 'danger'
  if (reason.includes('合规') || reason.includes('匹配') || reason.includes('优化')) return 'success'
  return 'info'
}
</script>

<style scoped>
.recommend-result {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}
.stats-row {
  margin-bottom: 16px;
}
.combo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.combo-card {
  border-left: 4px solid #409eff;
}
.combo-card.optimal {
  border-left-color: #67c23a;
}
.combo-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.combo-score {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.param-block {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px;
}
.param-label {
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.param-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}
.param-item {
  font-size: 12px;
  color: #606266;
}
.color-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
}
.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #dcdfe6;
}
.reason-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.loading-area {
  padding: 20px 0;
}
.empty-area {
  padding: 40px 0;
}
</style>
