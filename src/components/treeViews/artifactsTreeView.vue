<script setup>
import { computed, onBeforeMount, onMounted, ref } from 'vue';
import { useSelectedStore } from '@/stores/selectedItems';

const props = defineProps({
    treeData: Object
});
const selectedStore = useSelectedStore();

const treeItems = computed(() => {
    if (!props.treeData.content) return [];
    const content = props.treeData.content.content_json;
    const items = [];

    if (props.treeData.title === 'Strategic Alignment') {
        if (content.transformation) {
            items.push({
                id: 'transformation',
                title: 'Transformation',
                children: [{ id: 'transformation-val', title: content.transformation }]
            });
        }
        if (Array.isArray(content.supported_decisions) && content.supported_decisions.length > 0) {
            items.push({
                id: 'decisions',
                title: 'Supported Decisions',
                children: content.supported_decisions.map((d, i) => ({ id: `decision-${i}`, title: d }))
            });
        }
        if (Array.isArray(content.measurable_success) && content.measurable_success.length > 0) {
            items.push({
                id: 'success',
                title: 'Measurable Success',
                children: content.measurable_success.map((m, i) => ({
                    id: `success-${i}`,
                    title: `${m.metric} → ${m.target}`
                }))
            });
        }
        if (Array.isArray(content.out_of_scope) && content.out_of_scope.length > 0) {
            items.push({
                id: 'scope',
                title: 'Out of Scope',
                children: content.out_of_scope.map((s, i) => ({ id: `scope-${i}`, title: s }))
            });
        }
    } else if (props.treeData.title === 'Big Picture') {
        if (content.ecosystem_vision) {
            items.push({
                id: 'ecosystem',
                title: 'Ecosystem Vision',
                children: [{ id: 'ecosystem-val', title: content.ecosystem_vision }]
            });
        }
        if (content.success_definition) {
            items.push({
                id: 'success',
                title: 'Success Definition',
                children: [{ id: 'success-val', title: content.success_definition }]
            });
        }
        if (content.impacted_domains) {
            items.push({
                id: 'impacted',
                title: 'Impacted Domains',
                children: content.impacted_domains.map((d, i) => ({ id: `impacted-${i}`, title: `${d.name} -> ${d.description}` }))
            });
        }
    } else if (props.treeData.title === 'Domain Breakdown') {
        if (content.domains) {
            content.domains.forEach((el) => {
                items.push({
                    id: `domain-${el.id}`,
                    title: el.name,
                    children: [
                        { id: `objective-${el.id}`, title: `Objective: ${el.objective}` },
                        { id: `owner-${el.id}`, title: `Owner: ${el.owner.name}` },
                        { id: `description-${el.id}`, title: `Description: ${el.description}` }
                    ]
                });
            });
        }
    } else if (props.treeData.title === 'Module Matrix') {
        if (content.modules_overview) {
            content.modules_overview.forEach((el) => {
                items.push({
                    id: `module-${el.id}`,
                    title: el.name,
                    children: [
                        { id: `domain-${el.id}`, title: `Domain: ${el.domain?.name || el.domain || 'N/A'}` },
                        { id: `priority-${el.id}`, title: `Priority: ${el.priority}` },
                        { id: `phase-${el.id}`, title: `Phase: ${el.phase || 'N/A'}` }
                    ]
                });
            });
        }
    } else if (props.treeData.title === 'System Architecture') {
        if (content.auth_model) {
            items.push({
                id: 'auth',
                title: 'Auth Model',
                children: [{ id: 'auth-val', title: content.auth_model }]
            });
        }
        if (content.api_style) {
            items.push({
                id: 'api',
                title: 'API Style',
                children: [{ id: 'api-val', title: content.api_style }]
            });
        }
        if (content.data_model_notes) {
            items.push({
                id: 'data',
                title: 'Data Model Notes',
                children: [{ id: 'data-val', title: content.data_model_notes }]
            });
        }
        if (content.scalability_notes) {
            items.push({
                id: 'scalability',
                title: 'Scalability Notes',
                children: [{ id: 'scalability-val', title: content.scalability_notes }]
            });
        }
    } else if (props.treeData.title === 'Phase Scope') {
        if (content.acceptance_criteria) {
            items.push({
                id: 'acceptance',
                title: 'Acceptance Criteria',
                children: content.acceptance_criteria.map((c, i) => ({ id: `acceptance-${i}`, title: c }))
            });
        }
        if (content.excluded_items) {
            items.push({
                id: 'excluded',
                title: 'Excluded Items',
                children: content.excluded_items.map((c, i) => ({ id: `excluded-${i}`, title: c }))
            });
        }
        if (content.included_modules) {
            items.push({
                id: 'modules',
                title: 'Included Modules',
                children: content.included_modules.map((m, i) => ({ id: `module-${i}`, title: m.name || m }))
            });
        }
    }
    return items;
});
</script>
<template>
    <v-treeview :items="treeItems" item-children="children" item-title="title" item-value="id" open-all color="primary">
        <template v-slot:prepend="{ item }">
            <v-icon v-if="!item.children" size="small">mdi-arrow-right-thick</v-icon>
            <!-- <v-icon v-else size="small">mdi-folder-outline</v-icon> -->
        </template>
    </v-treeview>
</template>
<style>
.v-treeview .v-list-item-title {
    white-space: normal !important;
    word-break: break-word !important;
    overflow: visible !important;
    text-overflow: unset !important;
    line-height: 1.4;
}
.v-treeview .v-list-item {
    min-height: auto !important;
    height: auto !important;
}
.v-treeview .v-list-item__content {
    overflow: visible !important;
}
</style>
