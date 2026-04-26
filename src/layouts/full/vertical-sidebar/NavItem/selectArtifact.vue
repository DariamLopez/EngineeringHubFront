<script setup>
import { onMounted } from 'vue';
import Icon from '../Icon.vue';
import { useSelectedStore } from '@/stores/selectedItems';

const selectedStore = useSelectedStore();
const props = defineProps({ item: Object, level: Number });

const handleClick = () => {
    selectedStore.selectArtifact(props.item);
    selectedStore.selectData = 'artifact';
    //console.log(selectedStore.selectData);
};
</script>

<template>
    <!---Single Item-->
    <v-list-item
        rounded
        class="mb-1"
        :active="selectedStore.selectData === 'artifact' && selectedStore.artifact?.url === item.to"
        :disabled="item.disabled"
        :target="item.type === 'external' ? '_blank' : ''"
        v-scroll-to="{ el: '#top' }"
        @click="handleClick()"
    >
        <!---If icon-->
        <template v-slot:prepend>
            <Icon :item="item.icon" :level="level" />
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
        <!---If Caption-->
        <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
            {{ item.subCaption }}
        </v-list-item-subtitle>
        <!---If any chip or label-->
        <template v-slot:append v-if="item.chip">
            <v-chip
                :color="item.chipColor"
                :class="'sidebarchip hide-menu bg-' + item.chipBgColor"
                :size="item.chipIcon ? 'small' : 'small'"
                :variant="item.chipVariant"
                :prepend-icon="item.chipIcon"
            >
                {{ item.chip }}
            </v-chip>
        </template>
    </v-list-item>
</template>
