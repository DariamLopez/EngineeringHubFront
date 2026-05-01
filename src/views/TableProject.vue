<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Projects">
                <v-row v-if="!loading" class="justify-space-between">
                    <v-col cols="8">
                        <v-text-field
                            v-model="search"
                            append-inner-icon="mdi-magnify"
                            label="Search"
                            single-line
                            hide-details
                            class="mb-5"
                        />
                    </v-col>
                    <v-col class="d-flex justify-end">
                        <v-btn v-if="authStore.user.user.roles[0].name == 'admin'" to="/FormProject"> New Project </v-btn>
                    </v-col>
                </v-row>
                <v-skeleton-loader v-if="loading" type="table"></v-skeleton-loader>
                <v-data-table
                    v-else
                    :loading="updatingTable"
                    items-per-page="5"
                    :headers="ProjectHeaders"
                    :items="projects"
                    :search="search"
                    class="border rounded-md"
                    
                > <!-- :row-props="({ item }) => ({ style: { backgroundColor: item.style } })" -->
                    <template v-slot:item.name="{ item }">
                        <span class="mx-2">{{ item.name }}</span>
                        <v-tooltip :text="item.description ? item.description : 'No description available'">
                            <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" size="20">mdi-alert-circle-outline</v-icon>
                            </template>
                        </v-tooltip>
                    </template>
                    <template v-slot:item.status="{ item }">
                        <div class="d-flex justify-center" :style="{ 'background-color': item.style}">
                            <span>
                            {{ item.status }}
                        </span>
                        </div>
                    </template>
                    <template v-slot:item.created_at="{ item }">
                        {{ formatDate(item.created_at) }}
                    </template>
                    <!-- Columna de acciones -->
                    <template v-slot:item.actions="{ item }">
                        <v-tooltip
                            v-if="authStore.user.user.roles[0].name == 'admin' || authStore.user.abilities.includes('edit_projects')"
                            text="Edit Project"
                        >
                            <!-- v-if="authStore.user.user.roles[0].name == 'admin' || authStore.user.user.abilities.includes('edit_projects')" -->
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="30" color="success" class="mr-1" @click="openEditDialog(item)">
                                    <v-icon style="font-size: 15px">mdi-pencil</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>

                        <v-tooltip v-if="authStore.user.user.roles[0].name == 'admin'" text="Delete Project">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="30" color="error" class="mr-1" @click="deleteDialog(item)">
                                    <v-icon style="font-size: 15px">mdi-delete</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>

                        <v-tooltip text="View Project Details">
                            <template v-slot:activator="{ props }">
                                <v-btn
                                    :loading="loading_details === item.id"
                                    v-bind="props"
                                    icon
                                    size="30"
                                    color="primary"
                                    @click="goToDetail(item)"
                                >
                                    <v-icon style="font-size: 15px">mdi-magnify</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </template>
                </v-data-table>

                <!-- Dialog para editar -->
                <v-dialog v-model="editDialog" max-width="600">
                    <v-card>
                        <v-card-title>Edit Project</v-card-title>
                        <v-card-text>
                            <v-text-field label="Name" v-model="selectedProject.name" />
                            <v-text-field label="Client Name" v-model="selectedProject.client_name" />
                            <!-- <v-text-field label="Created by" v-model="selectedProject.created" /> -->
                            <v-select
                                label="Status"
                                :items="[
                                    { title: 'Draft', value: 'draft' },
                                    { title: 'Discovery', value: 'discovery' },
                                    { title: 'Execution', value: 'execution' },
                                    { title: 'Delivered', value: 'delivered' }
                                ]"
                                v-model="selectedProject.status"
                            />
                            <p v-if="updateErrors" class="text-error">{{ updateErrors.message }}</p>
                            <v-textarea
                                label="Project Description"
                                placeholder="Project Description"
                                row-height="25"
                                rows="3"
                                variant="outlined"
                                auto-grow
                                v-model="selectedProject.description"
                            ></v-textarea>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn @click="closeDialog()">Cancel</v-btn>
                            <v-btn color="success" @click="saveEdit()">Save</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </UiParentCard>
        </v-col>
    </v-row>
    <v-dialog v-model="delete_dialog" max-width="400">
        <v-card>
            <v-card-title class="text-h6">Confirm deletion</v-card-title>
            <v-card-text>
                Are you sure you want to delete the project
                <strong>{{ selectedProject.name }}</strong
                >? This action cannot be undone.
            </v-card-text>
            <v-card-actions class="d-flex justify-end">
                <v-btn variant="text" @click="delete_dialog = false">Cancel</v-btn>
                <v-btn color="error" variant="outlined" @click="deleteProject(selectedProject)">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
//TODO paginacion
//TODO Falta filtrado
//TODO Dialog para confirmar delete
import { onMounted, ref, markRaw } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useRouter } from 'vue-router';
import { useSelectedStore } from '@/stores/selectedItems';
import { useAuditEventsStore } from '@/stores/auditEvents';
import { useAuthStore } from '@/stores/auth';
import axiosServices from '@/utils/axios';
import { CircleIcon } from 'vue-tabler-icons';
import { formatDate } from '@/utils/helpers/dateFormat';
import { statusProject } from '@/enum/enum';

const authStore = useAuthStore();

const selectedStore = useSelectedStore();
const router = useRouter();
const loading = ref(true);
const loading_details = ref(null);
const updatingTable = ref(false);
const updateErrors = ref(null);
const ProjectHeaders = [
    { title: 'Name', align: 'start', key: 'name' },
    { title: 'Client Name', align: 'start', key: 'client_name' },
    { title: 'Created by', align: 'start', key: 'created_by.name' },
    { title: 'Status', align: 'start', key: 'status' },
    { title: 'Created at', align: 'start', key: 'created_at' },
    { title: 'Actions', align: 'center', key: 'actions' }
];

const page = ref({ title: 'Projects List' });
const breadcrumbs = ref([
    { text: 'Home', disabled: false, href: '/' },
    { text: 'Projects List', disabled: true, href: '#' }
]);

const search = ref('');
/* const projects = ref([...ProjectItems]); */
const projects = ref([]);

const editDialog = ref(false);
const delete_dialog = ref(false);
const selectedProject = ref({});

onMounted(async () => {
    projects.value = await getProjects();
    loading.value = false;
});
// Funciones
const deleteDialog = async (project) => {
    selectedProject.value = project;
    delete_dialog.value = true;
};
async function getProjects() {
    const response = await axiosServices.get('/projects')
    .then((res) => {
        res = res.data.map((item) => {
                return {
                    ...item,
                    style: statusProject.find((status) => status.value === item.status)?.style
                };
            });
        return res;
    })
    return response;
}
const getModules = async (projectId) => {
    const response = await axiosServices
        .get('/modules', {
            params: {
                project_id: projectId
            }
        })
        .then((res) => {
            //console.log('Modules fetched:', res.data);
            return res.data;
        })
        .catch((err) => {
            console.error('Error fetching modules:', err);
            return [];
        });
    return response;
};
function openEditDialog(item) {
    selectedProject.value = { ...item };
    editDialog.value = true;
}
function closeDialog() {
    editDialog.value = false;
    selectedProject.value = {};
    updateErrors.value = null;
}
async function saveEdit() {
    updateErrors.value = null;
    updatingTable.value = true;
    if (!selectedProject.value) return;
    const response = await axiosServices
        .put(`/projects/${selectedProject.value.id}`, {
            name: selectedProject.value.name,
            client_name: selectedProject.value.client_name,
            status: selectedProject.value.status,
            is_archived: selectedProject.value.is_archived,
            description: selectedProject.value.description ? selectedProject.value.description : null
        })
        .then(async (response) => {
            closeDialog();
            projects.value = await getProjects();
            updatingTable.value = false;
        })
        .catch((error) => {
            console.error('Error updating project:', error);
            updateErrors.value = error.response.data;
            updatingTable.value = false;
        });
}

function deleteProject(item) {
    updatingTable.value = true;
    delete_dialog.value = false;
    axiosServices
        .delete(`/projects/${item.id}`)
        .then(async (response) => {
            projects.value = await getProjects();
            updatingTable.value = false;
        })
        .catch((error) => {
            console.error('Error deleting project:', error);
            updatingTable.value = false;
        });
}

const goToDetail = async (item) => {
    loading_details.value = item.id;
    const modulesList = await getModules(item.id);
    const sideModules = [
        { header: 'Modules' },
        ...modulesList.map((m) => (m ? { module: { id: m.id, name: m.name }, icon: markRaw(CircleIcon) } : null)).filter(Boolean)
    ];
    selectedStore.saveModules(sideModules);
    selectedStore.selectProject(item);
    loading_details.value = null;
};
</script>
