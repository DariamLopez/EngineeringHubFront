<script setup>
import { ArtifactItems } from '@/_mockApis/dataTable';
import { computed, ref } from 'vue';
import { useSelectedStore } from '@/stores/selectedItems';
import { useAuthStore } from '@/stores/auth';
import { typeArtifact, statusArtifact } from '@/enum/enum';
import axiosServices from '@/utils/axios';
import ArtifactsTreeView from './treeViews/artifactsTreeView.vue';
import { useRouter } from 'vue-router';
import FormArtifact from './form/FormArtifact.vue';

const router = useRouter();
const selectedStore = useSelectedStore();
const authStore = useAuthStore();

const artifacts = ref(selectedStore.artifact.content);

const form_artifact = ref(null);
const dialog = ref(false);
const delete_dialog = ref(false);
const loading_users = ref(false);
const loading_save = ref(false);
const delete_loading = ref(false);

//const dialogJson = ref(false);
const selectedArtifact = ref(selectedStore.artifact.content);
const api_users = ref([]);

const openDialog = async () => {
    //selectedArtifact.value = { ...selectedStore.artifact.content };
    loading_users.value = true;
    api_users.value = await getUsers();
    loading_users.value = false;
    dialog.value = true;
};

/* function openDialogJson(item: any) {
    selectedArtifact.value = { ...item };
    dialogJson.value = true;
} */

/* function saveJson() {
    if (!selectedArtifact.value) return;
    const index = artifacts.value.findIndex((p) => p.project_id === selectedArtifact.value.project_id);
    if (index !== -1) {
        artifacts.value[index] = { ...selectedArtifact.value };
    }
    dialogJson.value = false;
} */

async function save() {
    loading_save.value = true;
    if (!selectedArtifact.value) return;
    await form_artifact.value.handleSubmit();
    loading_save.value = false;
    dialog.value = false;
    const refreshed = await readArtifact()
    if (refreshed) {
        selectedStore.artifact.content = refreshed;
    }
}

const onClose = async () => {
    const refreshed = await readArtifact();
    if (refreshed) {
        selectedStore.artifact.content = refreshed;
    }
    dialog.value = false
};

const readArtifact = async () => {
    const artifact = await axiosServices.get(`/artifacts/${selectedStore.artifact.content.id}`).catch((err) => {
        console.error('Error refreshing artifact:', err);
        return null;
    });
    return artifact.data
};
const deleteArtifact = async () => {
    delete_loading.value = true;
    if (selectedStore.artifact.content.type == 'big_picture') {
        await deleteMassiveDomains(selectedStore.artifact.content.content_json.impacted_domains.map((d) => d.id)).catch((err) => {
            console.error('Error deleting associated domains:', err);
        });
    }
    if (selectedStore.artifact.content.type == 'module_matrix') {
        await deleteMassiveModules(selectedStore.artifact.content.content_json.modules_overview.map((m) => m.id)).catch((err) => {
            console.error('Error deleting associated modules:', err);
        });
    }
    await axiosServices.delete(`/artifacts/${selectedStore.artifact.content.id}`).catch((err) => {
        console.error('Error deleting artifact:', err);
    });
    delete_loading.value = false;
    delete_dialog.value = false;
    selectedStore.artifact.content = null;
};
const artifactStatusTitle = computed(
    () => statusArtifact.find((s) => s.value === selectedStore.artifact.content.status)?.title ?? selectedStore.artifact.content.status
);

const getUsers = async () => {
    const response = await axiosServices
        .get('/users')
        .then((res) => {
            return res.data;
        })
        .catch((err) => {
            console.error('Error fetching users:', err);
            return [];
        });
    return response;
};
const deleteMassiveDomains = async (domainIds = []) => {
    await axiosServices
        .delete('/domains/massive', {
            data: {
                project_id: selectedStore.project.id,
                domain_ids: domainIds
            }
        })
        .catch((err) => {
            console.error('Error deleting domain:', err);
        });
};
const deleteMassiveModules = async (moduleIds = []) => {
    await axiosServices
        .delete('/modules/massive', {
            data: {
                project_id: selectedStore.project.id,
                module_ids: moduleIds
            }
        })
        .catch((err) => {
            console.error('Error deleting module:', err);
        });
};
</script>

<template>
    <h2 class="text-h6 mb-4">{{ selectedStore.artifact.title }}</h2>

    <v-row class="mb-2">
        <v-col cols="12" class="pb-0">
            <!-- Cabecera del proyecto -->
            <!-- <v-card-title class="d-flex justify-start align-center">
                    <span class="text-h6 font-weight-bold mr-2">Project ID: {{ item.project_id }}</span>
                    <v-chip :color="item.status === 'completed' ? 'green' : 'blue'" text-color="white" size="small">
                        {{ item.status }}
                    </v-chip>
                </v-card-title> -->
            <v-card-subtitle class="mb-1">
                Owner: <strong>{{ selectedStore.artifact.content.owner.name }}</strong>
                <span v-if="selectedStore.artifact.content.completed_at" class="ml-4">
                    Completed at: {{ selectedStore.artifact.content.completed_at }}
                </span>
                <p>
                    Status: <strong>{{ artifactStatusTitle }}</strong>
                </p>
            </v-card-subtitle>

            <!-- Contenido dinámico -->
            <v-card-text class="pt-2 pb-0">
                <div>
                    <ArtifactsTreeView :treeData="selectedStore.artifact"></ArtifactsTreeView>
                </div>
            </v-card-text>
            <v-card-actions class="f-flex justify-end py-2">
                <v-btn @click="$router.push('/TableProject')">Back</v-btn>
                <v-btn :loading="loading_users" v-if="authStore.user.user.roles[0].name == 'admin' || authStore.user.abilities.includes('edit_artifact')" @click="openDialog()">Update Artifact</v-btn>
                <v-btn color="error" v-if="authStore.user.user.roles[0].name == 'admin' || authStore.user.abilities.includes('edit_artifact')" @click="delete_dialog = true">Delete Artifact</v-btn>
            </v-card-actions>

            <!-- Dialog to update the artifact -->
            <v-dialog persistent v-model="dialog" max-width="800">
                <v-card>
                    <v-card-title></v-card-title>
                    <v-card-text>
                        <!-- Elementos fijos del artifact -->
                        <!-- <v-col cols="12">
                            <VTextField
                                type="text"
                                label="Project ID"
                                placeholder="123456"
                                hide-details
                                v-model="selectedArtifact.project_id"
                            ></VTextField>
                        </v-col> -->
                        <!-- <v-col cols="12">
                            <v-select :items="typeArtifact" v-model="selectedArtifact.type" label="Select Type" hide-details />
                        </v-col> -->
                        <v-col cols="12">
                            <v-select
                                :items="statusArtifact"
                                v-model="selectedStore.artifact.content.status"
                                label="Select Status"
                                hide-details
                            />
                        </v-col>
                        <v-col cols="12">
                            <v-select
                                label="Owner User"
                                :items="api_users"
                                item-title="name"
                                item-value="id"
                                v-model="selectedStore.artifact.content.owner_user_id"
                            >
                                <template v-slot:append-inner>
                                    <v-progress-circular v-if="loading_users" :size="24" indeterminate></v-progress-circular>
                                </template>
                            </v-select>
                        </v-col>
                        <FormArtifact ref="form_artifact" :is_create="false" />
                    </v-card-text>
                    <v-card-actions>
                        <!-- <v-btn @click="openDialogJson(selectedArtifact)">Json</v-btn> -->
                        <v-btn @click="onClose">Close</v-btn>
                        <v-btn :loading="loading_save" @click="save()">Save</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
            <!-- Dialog de confirmación de eliminación -->
            <v-dialog v-model="delete_dialog" max-width="400">
                <v-card>
                    <v-card-title class="text-h6">Confirm deletion</v-card-title>
                    <v-card-text>
                        Are you sure you want to delete the artifact
                        <strong>{{ selectedStore.artifact.title }}</strong
                        >? This action cannot be undone.
                    </v-card-text>
                    <v-card-actions class="d-flex justify-end">
                        <v-btn variant="text" @click="delete_dialog = false">Cancel</v-btn>
                        <v-btn color="error" :loading="delete_loading" variant="outlined" @click="deleteArtifact()">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-col>
    </v-row>
</template>

<style scoped>
h2 {
    font-weight: bold;
    color: #3f51b5;
}
</style>
