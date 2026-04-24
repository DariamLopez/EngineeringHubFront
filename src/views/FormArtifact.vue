<script setup lang="ts">
import { onMounted, ref } from 'vue';

import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import FormArtifact from '@/components/form/FormArtifact.vue';
import { useSelectedStore } from '@/stores/selectedItems';
import { typeArtifact } from '@/enum/enum';
import { useRouter } from 'vue-router';

const form_artifact = ref<InstanceType<typeof FormArtifact> | null>(null);
const router = useRouter();
const selectedStore = useSelectedStore();
const page = ref({ title: 'Artifact Form' });
const breadcrumbs = ref([
    {
        text: 'Dashboard',
        disabled: false,
        href: '/'
    },
    {
        text: 'Projects List',
        disabled: false,
        href: '/TableProject'
    },
    {
        text: 'Details Projects',
        disabled: false,
        href: `/DetailsProject/${selectedStore.project?.name}/${selectedStore.artifact?.url}`
    },
    {
        text: `New ${selectedStore.artifact?.title}`,
        disabled: true,
        href: '/FormArtifact'
    }
]);

const project_name = ref(selectedStore.project?.name || '');
const type = ref(selectedStore.artifact);

const submit_loading = ref(false);

const onCreate = async () => {
    submit_loading.value = true;
    await form_artifact.value?.handleSubmit();
    submit_loading.value = false;
};
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12" md="12">
            <UiParentCard :title="`Create ${selectedStore.artifact?.title}`">
                <v-row>
                    <v-col cols="12">
                        <v-label class="font-weight-medium mb-2">Proyect</v-label>
                        <VTextField type="text" disabled hide-details v-model="project_name"></VTextField>
                    </v-col>
                    <v-col cols="12">
                        <v-label class="font-weight-medium mb-2">Type</v-label>
                        <v-select disabled :items="typeArtifact" v-model="type" label="Select Type" hide-details />
                    </v-col>
                </v-row>
                <v-col cols="12">
                    <FormArtifact ref="form_artifact"></FormArtifact>
                </v-col>
                <v-row class="mt-4">
                    <v-col cols="6" class="align-start">
                        <v-btn variant="outlined" @click="router.back()" color="primary" flat>Cancel</v-btn>
                    </v-col>
                    <!-- <v-col cols="4" class="d-flex justify-center">
            <v-btn variant="outlined" color="primary" @click="openDialog()"> Add Content JSON </v-btn>
        </v-col> -->
                    <v-col cols="6" class="d-flex justify-end">
                        <v-btn :loading="submit_loading" variant="outlined" @click="onCreate" color="primary" flat
                            >Create Artifact</v-btn
                        >
                    </v-col>
                </v-row>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
