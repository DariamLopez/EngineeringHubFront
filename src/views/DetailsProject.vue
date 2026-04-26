<script setup>
import { ref, computed, onMounted, watch, onUpdated } from 'vue';
import { useRouter } from 'vue-router';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import ArtifactContent from '@/components/ArtifactContent.vue';
import ModuleContent from '@/components/ModuleContent.vue';
import { useSelectedStore } from '@/stores/selectedItems';
import { useAuthStore } from '@/stores/auth';
import { ArtifactItems } from '@/_mockApis/dataTable';
import axiosServices from '@/utils/axios';

const selectedStore = useSelectedStore();
const authStore = useAuthStore();
const loading = ref(false);

const page = ref({ title: 'Details Projects' });
const breadcrumbs = ref([
    { text: 'Home', disabled: false, href: '/' },
    { text: 'Projects List', disabled: false, href: '/TableProject' },
    { text: 'Details Projects', disabled: true, href: '#' }
]);

const project = selectedStore.project;

const getArtifact = async () => {
    const response = await axiosServices
        .get('/artifacts', {
            params: {
                project_id: project.id,
                type: selectedStore.artifact.url
            }
        })
        .then((res) => {
            return res.data[0];
        })
        .catch((err) => {
            console.error('Error fetching artifact:', err);
            return null;
        });
    return response;
};
const getModule = async (id) => {
    const response = await axiosServices
        .get(`/modules/${id}`)
        /* .then((res) => {
            return res.data[0];
        }) */
        .catch((err) => {
            console.error('Error fetching module:', err);
            return null;
        });
    //console.log('Module response:', response.data);
    return response.data;
};
onMounted(async () => {
    loading.value = true;
    if (selectedStore.selectData === 'artifact') {
        selectedStore.artifact.content = await getArtifact();
    }
    if (selectedStore.selectData === 'module') {
        selectedStore.module.content = await getModule(selectedStore.module.id);
    }
    loading.value = false;
});
onUpdated(async () => {
    loading.value = true;
    if (selectedStore.selectData === 'artifact') {
        selectedStore.artifact.content = await getArtifact();
    } else if (selectedStore.selectData === 'module') {
        selectedStore.module.content = await getModule(selectedStore.module.id);
    }
    loading.value = false;
});
/* watch(
    selectedStore.artifact,
    (newVal) => {
        if (selectedStore.selectData === 'artifact') {
            getArtifact();
        }
    },
    { deep: true }
); */
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Details" card_vertical_padding="3">
                <v-card-title class="d-flex justify-start align-center pt-0">
                    <h2 class="font-weight-bold">{{ project.name }}</h2>
                    <v-chip :color="project.status === 'completed' ? 'green' : 'blue'" text-color="white" size="small" class="ml-2">
                        {{ project.status }}
                    </v-chip>
                </v-card-title>

                <!-- Contenido -->
                <v-card-text class="py-2">
                    <p><strong>Client Name:</strong> {{ project.client_name }}</p>
                    <p><strong>Created by:</strong> {{ project.created_by.name }}</p>
                </v-card-text>
                <v-row>
                    <v-col>
                        <v-card class="px-3 pt-3 pb-0">
                            <v-skeleton-loader v-if="loading" type="article"></v-skeleton-loader>
                            <template v-else>
                                <ArtifactContent v-if="selectedStore.selectData === 'artifact' && selectedStore.artifact.content" />
                                <div
                                    v-else-if="selectedStore.selectData === 'artifact' && !selectedStore.artifact.content"
                                    class="d-flex flex-column align-center justify-center"
                                >
                                    <h2 class="text-h6 pa-2 ma-2">
                                        This type of artifact is not assigned to {{ selectedStore.project?.name }}
                                    </h2>
                                    <v-btn
                                        v-if="authStore.user.user.roles[0].name == 'admin' ||authStore.user.abilities.includes('edit_artifact')"
                                        variant="outlined"
                                        class="pa-2 ma-2"
                                        @click="$router.push('/DetailsProject/FormArtifact')"
                                        >Create Artifact</v-btn
                                    >
                                </div>
                                <ModuleContent v-else-if="selectedStore.selectData === 'module' && selectedStore.module.content" />
                            </template>
                        </v-card>
                    </v-col>
                </v-row>
            </UiParentCard>
        </v-col>
    </v-row>
</template>

<style scoped>
h2 {
    font-weight: bold;
    color: #3f51b5;
}
</style>
