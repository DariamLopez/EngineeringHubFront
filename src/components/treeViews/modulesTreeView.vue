<script setup>
import { computed, onBeforeMount, onMounted } from 'vue';

const props = defineProps({
    treeData: Object
});
const treeItems = computed(() => {
    if (!props.treeData) return [];
    const module = props.treeData;
    const items = [];
    //console.log('Computing tree items for module:', module); 
    if (module.objective) {
        items.push({
            id: 'objective',
            title: 'Objective',
            children: [{ id: 'objective-val', title: module.objective }]
        });
    }
    if (module.inputs && module.inputs.length > 0) {
        items.push({
            id: 'inputs',
            title: 'Inputs',
            children: module.inputs.map((input, i) => ({ id: `input-${i}`, title: input }))
        });
    }
    if (module.data_structure && module.data_structure.length > 0) {
        items.push({
            id: 'data',
            title: 'Data Structure',
            children: module.data_structure.map((data, i) => ({ id: `data-${i}`, title: data }))
        });
    }
    if (module.logic_rules) {
        items.push({
            id: 'logic',
            title: 'Logic Rules',
            children: [{ id: 'logic-val', title: module.logic_rules }]
        });
    }
    if (module.outputs && module.outputs.length > 0) {
        items.push({
            id: 'outputs',
            title: 'Outputs',
            children: module.outputs.map((output, i) => ({ id: `output-${i}`, title: output }))
        });
    }
    if (module.responsibility) {
        items.push({
            id: 'responsibility',
            title: 'Responsibility',
            children: [{ id: 'responsibility-val', title: module.responsibility }]
        });
    }
    if (module.failure_scenarios) {
        items.push({
            id: 'failure',
            title: 'Failure Scenarios',
            children: [{ id: 'failure-val', title: module.failure_scenarios }]
        });
    }
    if (module.audit_trail_requirements) {
        items.push({
            id: 'audit',
            title: 'Audit Trail Requirements',
            children: [{ id: 'audit-val', title: module.audit_trail_requirements }]
        });
    }
    if (Array.isArray(module.dependencies) && module.dependencies.length > 0) {
        items.push({
            id: 'dependencies',
            title: 'Dependencies',
            children: module.dependencies.map((dep, i) => ({ id: `dep-${i}`, title: dep.name }))
        });
    }
    if (module.version_note) {
        items.push({
            id: 'version',
            title: 'Version Note',
            children: [{ id: 'version-val', title: module.version_note }]
        });
    }
    if (module.phase) {
        items.push({
            id: 'phase',
            title: 'Phase',
            children: [{ id: 'phase-val', title: module.phase }]
        });
    }
    if (module.priority) {
        items.push({
            id: 'priority',
            title: 'Priority',
            children: [{ id: 'priority-val', title: module.priority }]
        });
    }
    //console.log('Tree items for module:', items);
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