<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import artifactsTreeView from '@/components/treeViews/artifactsTreeView.vue';
import modulesTreeView from '@/components/treeViews/modulesTreeView.vue';
import auditTreeView from '@/components/treeViews/auditTreeView.vue';

import { AuditEvents, AuditEventHeaders } from '@/_mockApis/dataTable';
import axiosServices from '@/utils/axios';
import { formatDate } from '@/utils/helpers/dateFormat';

const route = useRoute();

const paginate = ref({
    page: 1,
    itemsPerPage: 10,
    totalItems: 0
});

const loading_table = ref(true);
const loading_paginate = ref(false);
const page = ref({ title: 'Audit Events' });
const breadcrumbs = ref([
    {
        text: 'Home',
        disabled: false,
        href: '/'
    },
    {
        text: 'Audit Events',
        disabled: true,
        href: '#'
    }
]);

const jsonDialog = ref(false);
const selectedItem = ref(null);

const auditHeaders = ref([
    {
        title: 'Log',
        align: 'start',
        key: 'log'
    },
    {
        title: 'Date',
        align: 'start',
        key: 'created_at'
    },
    {
        title: 'Actions',
        align: 'end',
        key: 'actions'
    }
]);
const audits = ref([]);

const search = ref();
const projects = ref([
    {
        name: 'All Projects',
        id: null
    }
]);
const selectedProject = ref(null);

onMounted(async () => {
    audits.value = await getAudit(paginate.value.page, paginate.value.itemsPerPage);
    projects.value.push(...(await getProjects()));
    loading_table.value = false;
});

const getAudit = async (page, itemsPerPage, project = null) => {
    const response = await axiosServices
        .get('/audit-trails', {
            params: {
                page,
                per_page: itemsPerPage,
                project_id: project
            }
        })
        .then((res) => {
            paginate.value.totalItems = res.data.total || 0;
            res.data = res.data.data.map((item) => {
                return {
                    ...item,
                    created_at: item.created_at ? formatDate(item.created_at) : ''
                };
            });
            return res.data;
        })
        .catch((error) => {
            console.error('Error fetching audit events:', error);
        });
    return response;
};
const getProjects = async () => {
    const response = await axiosServices
        .get('/projects')
        .then((res) => {
            res = res.data;
            return res;
        })
        .catch((error) => {
            console.error('Error fetching projects:', error);
        });
    return response;
};
const onTableUpdate = async ({ page, itemsPerPage }) => {
    loading_paginate.value = true;
    paginate.value.page = page;
    paginate.value.itemsPerPage = itemsPerPage;
    audits.value = await getAudit(paginate.value.page, paginate.value.itemsPerPage, selectedProject.value);
    loading_paginate.value = false;
};
const onProjectSelected = async (projectId) => {
    loading_paginate.value = true;
    paginate.value.page = 1; // Reset to first page when changing project
    audits.value = await getAudit(paginate.value.page, paginate.value.itemsPerPage, projectId);
    loading_paginate.value = false;
};
const openDialog = (item) => {
    selectedItem.value = item;
    jsonDialog.value = true;
};
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Audits">
                <v-skeleton-loader v-if="loading_table" type="table"></v-skeleton-loader>
                <!-- <v-text-field
                    v-if="!loading_table"
                    v-model="search"
                    append-inner-icon="mdi-magnify"
                    label="Search"
                    single-line
                    hide-details
                    class="mb-5"
                /> -->
                <v-select
                    v-if="!loading_table"
                    v-model="selectedProject"
                    :items="projects"
                    item-title="name"
                    item-value="id"
                    label="Filter for Projects"
                    dense
                    outlined
                    class="mb-5"
                    @update:modelValue="onProjectSelected"
                ></v-select>
                <v-data-table-server
                    v-model:items-per-page="paginate.itemsPerPage"
                    v-if="!loading_table"
                    :headers="auditHeaders"
                    :items="audits"
                    :items-length="paginate.totalItems"
                    :loading="loading_paginate"
                    :search="search"
                    @update:options="onTableUpdate"
                    class="elevation-1"
                >
                    <!-- <template v-slot:item.content_json="{ item }">
                        <v-tooltip text="Inspect JSONs">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="30" color="primary" @click="openDialog(item.before_json.status, item.after_json.status)">
                                    <v-icon style="font-size: 15px">mdi-magnify</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </template> -->
                    <template v-slot:item.log="{ item }">
                        <template v-if="item.entity_type == 'artifact'">
                            <span v-if="item.action != 'deleted'" class="mx-2"
                                >The user <strong>{{ item.actor.name }}</strong> with role
                                <strong>{{ item.actor.roles[0].name }}</strong> has performed an <strong>{{ item.action }}</strong> on
                                <strong>{{ item.entity_type }}</strong
                                >{{ ' ' }} <strong>{{ item.after_json && item.after_json.type ? item.after_json.type : 'N/A' }}</strong
                                >.</span
                            >
                            <span v-else class="mx-2"
                                >The user <strong>{{ item.actor.name }}</strong> with role
                                <strong>{{ item.actor.roles[0].name }}</strong> has performed an <strong>{{ item.action }}</strong> on
                                <strong>{{ item.entity_type }}</strong
                                >{{ ' ' }} <strong>{{ item.before_json && item.before_json.type ? item.before_json.type : 'N/A' }}</strong
                                >.</span
                            >
                        </template>
                        <template v-else>
                            <span v-if="item.action != 'deleted'" class="mx-2"
                                >The user <strong>{{ item.actor.name }}</strong> with role
                                <strong>{{ item.actor.roles[0].name }}</strong> has performed an <strong>{{ item.action }}</strong> on
                                <strong>{{ item.entity_type }}</strong
                                >{{ ' ' }} <strong>{{ item.after_json && item.after_json.name ? item.after_json.name : 'N/A' }}</strong
                                >.</span
                            >
                            <span v-else class="mx-2"
                                >The user <strong>{{ item.actor.name }}</strong> with role
                                <strong>{{ item.actor.roles[0].name }}</strong> has performed an <strong>{{ item.action }}</strong> on
                                <strong>{{ item.entity_type }}</strong
                                >{{ ' ' }} <strong>{{ item.before_json && item.before_json.name ? item.before_json.name : 'N/A' }}</strong
                                >.</span
                            >
                        </template>
                        <!-- <v-tooltip
                            :text="
                                item.before_json && item.after_json
                                    ? 'Before: ' + item.before_json.status + ', After: ' + item.after_json.status
                                    : 'No JSON data available'
                            "
                        >
                            <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" size="20">mdi-alert-circle-outline</v-icon>
                            </template>
                        </v-tooltip> -->
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon size="30" color="primary" @click="openDialog(item)">
                            <v-icon style="font-size: 15px">mdi-magnify</v-icon>
                        </v-btn>
                    </template>
                </v-data-table-server>

                <v-dialog v-model="jsonDialog" >
                    <v-card>
                        <v-card-title class="d-flex justify-center"><span>{{ selectedItem?.entity_type }} Details</span></v-card-title>
                        <v-card-text>
                            <auditTreeView v-if="selectedItem" :treeData="selectedItem" />
                        </v-card-text>
                        <v-card-actions>
                            <v-btn @click="jsonDialog = false">Close</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
                <v-card-actions>
                    <v-btn @click="$router.back()">Back</v-btn>
                </v-card-actions>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
