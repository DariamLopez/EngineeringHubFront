<script setup>
import { onMounted, ref, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useSelectedStore } from '@/stores/selectedItems';
import { useAuthStore } from '@/stores/auth';
import axiosServices from '@/utils/axios';
import { CircleIcon } from 'vue-tabler-icons';

const props = defineProps({
    is_create: {
        type: Boolean,
        default: true
    }
});

const router = useRouter();
const selectedStore = useSelectedStore();
const authStore = useAuthStore();

const type = ref(selectedStore.artifact); //
const content_json = ref({});

const api_domains = ref([]);
const api_users = ref([]);
const api_modules = ref([]);

const content_loading = ref(false);
const loading_delete = ref(null);
const error_message = ref('');
const snackbar = ref(false);
const formRef = ref(null);

const requiredRule = [(v) => !!v || 'Este campo es obligatorio'];

onMounted(async () => {
    content_json.value = await initContentJson(type.value.title);
    //console.log('Contenido JSON inicializado:', content_json.value);
});

const initContentJson = async (typeName) => {
    let content = [];
    switch (typeName) {
        case 'Strategic Alignment':
            if (props.is_create)
                return {
                    transformation: '',
                    supported_decisions: [''],
                    measurable_success: [{ metric: '', target: '' }],
                    out_of_scope: ['']
                };
            else return selectedStore.artifact.content.content_json;
        case 'Big Picture':
            if (props.is_create)
                return {
                    ecosystem_vision: '',
                    impacted_domains: [{ name: '', description: '' }],
                    success_definition: ''
                };
            else return selectedStore.artifact.content.content_json;
        case 'Domain Breakdown':
            content_loading.value = true;
            api_users.value = await getUsers();
            //console.log('Users fetched for Domain Breakdown:', api_users.value);
            api_domains.value = await getArtifact('big_picture').then((artifact) => artifact?.content_json?.impacted_domains || []);
            //console.log('Domains fetched for Domain Breakdown:', api_domains.value);
            content = [];
            if (props.is_create) {
                api_domains.value.forEach((d) => {
                    content.push(d.id);
                });
                content_loading.value = false;
                return {
                    domains: content
                };
            } else {
                content_loading.value = false;
                return selectedStore.artifact.content.content_json.domains;
            }
        case 'Module Matrix':
            content_loading.value = true;
            api_domains.value = await getArtifact('big_picture').then((artifact) => artifact?.content_json?.impacted_domains || []);
            //console.log('api_domains', api_domains.value);
            content_loading.value = false;
            if (props.is_create) return { modules_overview: [] };
            else return selectedStore.artifact.content.content_json;
        case 'Module Engineering':
            return {
                modules_overview: [{ name: '', domain: '', priority: '', phase: '' }]
            };
        case 'System Architecture':
            if (props.is_create)
                return {
                    auth_model: '',
                    api_style: '',
                    data_model_notes: '',
                    scalability_notes: ''
                };
            else return selectedStore.artifact.content.content_json;
        case 'Phase Scope':
            content_loading.value = true;
            api_modules.value = await getModules();
            //console.log('Modules fetched for Phase Scope:', api_modules.value);
            content_loading.value = false;
            if (props.is_create)
                return {
                    included_modules: [],
                    excluded_items: [''],
                    acceptance_criteria: ['']
                };
            else return selectedStore.artifact.content.content_json;
        default:
            return {};
    }
};

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return false;
    switch (type.value.title) {
        case 'Strategic Alignment':
            if (props.is_create) await createArtifact();
            else await updateArtifact();
            break;
        case 'Big Picture':
            if (props.is_create) {
                const domains = await createDomains(content_json.value.impacted_domains);
                content_json.value.impacted_domains = domains.map((d) => Number(d.id)).filter((id) => !Number.isNaN(id));
                await createArtifact();
            } else {
                await updateMassiveDomains(content_json.value.impacted_domains.filter((d) => d.id));
                content_json.value.impacted_domains.push(
                    ...(await createDomains(content_json.value.impacted_domains.filter((d) => !d.id)))
                );
                content_json.value.impacted_domains = content_json.value.impacted_domains
                    .map((d) => Number(d.id))
                    .filter((id) => !Number.isNaN(id));
                await updateArtifact();
            }
            break;
        case 'Domain Breakdown':
            if (props.is_create) {
                await updateMassiveDomains(api_domains.value);
                await createArtifact();
            } else {
                //await updateMassiveDomains(content_json.value.domains.map((id) => ({ id })));
                await updateMassiveDomains(api_domains.value);
                content_json.value = {
                    domains: api_domains.value.map((d) => Number(d.id)).filter((id) => !Number.isNaN(id))
                };
                await updateArtifact();
            }
            break;
        case 'Module Matrix':
            if (props.is_create) {
                if (content_json.value.modules_overview.length === 0) {
                    error_message.value = 'No modules to create. Please add at least one module to the overview.';
                    snackbar.value = true;
                    return;
                }
                const modules = await createModules(content_json.value.modules_overview);
                content_json.value.modules_overview = modules.modules.map((m) => Number(m.id)).filter((id) => !Number.isNaN(id));
                const existingModuleItems = Array.isArray(selectedStore.modules) ? selectedStore.modules.filter((m) => !m.header) : [];
                const newSidebarModules = [
                    { header: 'Modules' },
                    ...existingModuleItems,
                    ...modules.modules.map((m) => ({ module: { id: m.id, name: m.name }, icon: markRaw(CircleIcon) }))
                ];
                selectedStore.saveModules(newSidebarModules);
                await createArtifact();
            } else {
                const modulesToUpdate = content_json.value.modules_overview.filter((m) => m.id);
                const modulesToCreate = content_json.value.modules_overview.filter((m) => !m.id);
                if (modulesToUpdate.length > 0) {
                    await updateMassiveModules(modulesToUpdate);
                }

                if (modulesToCreate.length > 0) {
                    const createdModules = await createModules(modulesToCreate);
                    content_json.value.modules_overview.push(
                        ...createdModules.modules.map((m) => Number(m.id)).filter((id) => !Number.isNaN(id))
                    );
                    const newEntries = createdModules.modules.map((m) => ({ module: { id: m.id, name: m.name }, icon: markRaw(CircleIcon) }));
                    selectedStore.saveModules([...selectedStore.modules, ...newEntries]);
                }

                // Sync name changes for updated modules in the sidebar
                if (modulesToUpdate.length > 0) {
                    const updatedSidebarModules = selectedStore.modules.map((item) => {
                        if (item.header) return item;
                        const updated = modulesToUpdate.find((u) => u.id === item.module?.id);
                        return updated ? { ...item, module: { ...item.module, name: updated.name } } : item;
                    });
                    selectedStore.saveModules(updatedSidebarModules);
                }

                content_json.value.modules_overview = content_json.value.modules_overview
                    .map((d) => (typeof d === 'object' ? Number(d.id) : Number(d)))
                    .filter((id) => !Number.isNaN(id));
                await updateArtifact();
            }
            break;
        case 'Module Engineering':
            await createArtifact();
            break;
        case 'System Architecture':
            if (props.is_create) {
                await createArtifact();
            } else await updateArtifact();
            break;
        case 'Phase Scope':
            if (props.is_create) {
                await createArtifact();
            } else await updateArtifact();
            break;
        default:
            console.error('Tipo de artifact desconocido:', type.value.title);
    }
    if (props.is_create) router.back();
    return true;
};
const createArtifact = async () => {
    const response = await axiosServices
        .post('/artifacts', {
            project_id: selectedStore.project.id,
            type: type.value.url,
            owner_user_id: authStore.user.id,
            content_json: content_json.value
        })
        .catch((error) => {
            error_message.value = error.response?.data?.message;
            console.log('Error al crear artifact:', error.value);
            snackbar.value = true;
            return;
        });
    //console.log('Artifact creado:', response.data);
};
const getArtifact = async (type) => {
    const response = await axiosServices
        .get('/artifacts', {
            params: {
                project_id: selectedStore.project.id,
                type: type
            }
        })
        .then((res) => {
            //console.log('Artifact fetched:', res.data);
            return res.data[0];
        })
        .catch((err) => {
            console.error('Error fetching artifact:', err);
            return null;
        });
    return response;
};
const updateArtifact = async () => {
    const response = await axiosServices
        .put(`/artifacts/${selectedStore.artifact.content.id}`, {
            project_id: selectedStore.project.id,
            type: type.value.url,
            status: selectedStore.artifact.content.status,
            owner_user_id: selectedStore.artifact.content.owner_user_id,
            content_json: content_json.value
        })
        .catch((error) => {
            error_message.value = error.response?.data?.message;
            console.log('Error al actualizar artifact:', error);
            snackbar.value = true;
            return;
        });
    //console.log('Artifact actualizado:', response.data);
};
const getDomains = async () => {
    const response = await axiosServices
        .get('/domains', {
            params: {
                project_id: selectedStore.project.id
            }
        })
        .catch((error) => {
            console.error('Error fetching domains:', error);
            return [];
        });
    return response.data;
};
const createDomains = async (new_domains = []) => {
    if (new_domains.length === 0) return [];
    const domains = await axiosServices
        .post('/domains/massive', {
            project_id: selectedStore.project.id,
            domains: new_domains
        })
        .catch((error) => {
            console.log('Error al crear domains:', error);
            return;
        });
    //console.log('Domains creados:', domains);
    return domains.data;
};
const updateMassiveDomains = async (domains = []) => {
    const updated_domains = await axiosServices
        .put('/domains/massive', {
            project_id: selectedStore.project.id,
            domains: domains
            //domains: api_domains.value
        })
        .catch((error) => {
            console.error(`Error updating domain`, error);
        });

    //console.log('Domains actualizados:', updated_domains);
    return updated_domains;
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
const deleteModule = async (m, i) => {
    loading_delete.value = i;
    selectedStore.saveModules(selectedStore.modules.filter((mod) => !mod.module || mod.module.id !== m.id));
    if (m.id) {
        await axiosServices.delete('/modules/' + m.id).catch((err) => {
            console.error('Error deleting module:', err);
        });
        if (selectedStore.module?.id === m.id) {
            selectedStore.clearModule();
            router.push(`/DetailsProject/${selectedStore.project?.name}/${selectedStore.artifact.url}`);
        }
    }
    content_json.value.modules_overview.splice(i, 1);
    loading_delete.value = null;
};
const createModules = async (modules = []) => {
    const createdModules = await axiosServices
        .post('/modules/massive', {
            project_id: selectedStore.project.id,
            modules: modules
        })
        .catch((error) => {
            console.log('Error al crear modules:', error);
            return;
        });
    //console.log('Modules creados:', createdModules);
    return createdModules.data;
};
const updateMassiveModules = async (modules = []) => {
    const updated_modules = await axiosServices
        .put('/modules/massive', {
            project_id: selectedStore.project.id,
            modules: modules
        })
        .catch((error) => {
            console.error(`Error updating modules`, error);
        });

    //console.log('Modules actualizados:', updated_modules);
    return updated_modules;
};
const getModules = async () => {
    const response = await axiosServices
        .get('/modules', {
            params: {
                project_id: selectedStore.project.id
            }
        })
        .catch((error) => {
            console.error('Error fetching modules:', error);
            return [];
        });
    return response.data;
};
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
defineExpose({
    handleSubmit,
    deleteMassiveDomains
});
</script>

<template>
    <v-form ref="formRef">
        <!-- TODO hacer un formulario individual para cada artifact con su respectivo content_json -->
        <v-card class="mt-4">
            <v-card-title>{{ type?.title || 'Artifact' }} Details</v-card-title>
            <v-card-text>
                <v-skeleton-loader v-if="content_loading" type="article"></v-skeleton-loader>
                <template v-if="type?.title === 'Strategic Alignment'">
                    <v-text-field :rules="requiredRule" label="Transformation" v-model="content_json.transformation" />
                    <div v-for="(s, i) in content_json.supported_decisions || []" :key="i" class="d-flex ga-2 align-center mb-2">
                        <v-text-field
                            :rules="requiredRule"
                            :label="`Supported Decision No: ${i + 1}`"
                            v-model="content_json.supported_decisions[i]"
                        />
                        <v-btn
                            class="d-flex align-center"
                            icon="mdi-plus"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="content_json.supported_decisions.push('')"
                            :style="{ visibility: i === content_json.supported_decisions.length - 1 ? 'visible' : 'hidden' }"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            size="small"
                            @click="content_json.supported_decisions.splice(i, 1)"
                            :disabled="content_json.supported_decisions.length <= 1"
                        />
                    </div>
                    <div v-for="(o, i) in content_json.out_of_scope || []" :key="i" class="d-flex ga-2 align-center mb-2">
                        <v-text-field :rules="requiredRule" :label="`Out Of Scope No: ${i + 1}`" v-model="content_json.out_of_scope[i]" />
                        <v-btn
                            class="d-flex align-center"
                            icon="mdi-plus"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="content_json.out_of_scope.push('')"
                            :style="{ visibility: i === content_json.out_of_scope.length - 1 ? 'visible' : 'hidden' }"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            size="small"
                            @click="content_json.out_of_scope.splice(i, 1)"
                            :disabled="content_json.out_of_scope.length <= 1"
                        />
                    </div>
                    <v-label class="font-weight-medium mb-2">Measurable Success</v-label>
                    <div v-for="(m, i) in content_json.measurable_success || []" :key="i" class="d-flex ga-2 align-center mb-2">
                        <v-text-field :rules="requiredRule" label="Metric" v-model="m.metric" />
                        <v-text-field :rules="requiredRule" label="Target" v-model="m.target" />
                        <v-btn
                            class="d-flex align-center"
                            icon="mdi-plus"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="content_json.measurable_success.push({ metric: '', target: '' })"
                            :style="{ visibility: i === content_json.measurable_success.length - 1 ? 'visible' : 'hidden' }"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            size="small"
                            @click="content_json.measurable_success.splice(i, 1)"
                            :disabled="content_json.measurable_success.length <= 1"
                        />
                    </div>
                </template>

                <template v-else-if="type?.title === 'Big Picture'">
                    <v-text-field label="Ecosystem Vision" v-model="content_json.ecosystem_vision" />
                    <v-text-field label="Success Definition" v-model="content_json.success_definition" />
                    <v-label class="font-weight-medium mb-2">Impacted Domains</v-label>
                    <div v-for="(d, i) in content_json.impacted_domains || []" :key="i" class="d-flex ga-2 align-center mb-2">
                        <v-text-field :rules="requiredRule" label="Domain Name" v-model="d.name" />
                        <v-text-field :rules="requiredRule" label="Domain Description" v-model="d.description" />
                        <v-btn
                            class="d-flex align-center"
                            icon="mdi-plus"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="content_json.impacted_domains.push({ name: '', description: '' })"
                            :style="{ visibility: i === content_json.impacted_domains.length - 1 ? 'visible' : 'hidden' }"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            size="small"
                            @click="
                                props.is_create
                                    ? props.content_json.impacted_domains.splice(i, 1)
                                    : deleteMassiveDomains([d.id]).then(() => content_json.impacted_domains.splice(i, 1))
                            "
                            :disabled="content_json.impacted_domains.length <= 1"
                        />
                    </div>
                </template>

                <template v-else-if="type?.title === 'Domain Breakdown'">
                    <div v-if="api_domains.length === 0 && !content_loading">No domains found for this project. Create Domains first</div>
                    <v-card v-else v-for="(d, i) in api_domains" :key="i" class="mb-4">
                        <v-card-text class="py-1">
                            <div class="mb-2">
                                <p class="mb-2">
                                    <strong>{{ d.name }}</strong
                                    >: {{ d.description }}
                                </p>
                                <v-text-field :rules="requiredRule" label="Objective" v-model="d.objective" />
                                <v-select
                                    :rules="requiredRule"
                                    label="Owner User"
                                    :items="api_users"
                                    item-title="name"
                                    item-value="id"
                                    v-model="d.owner_user_id"
                                />
                            </div>
                        </v-card-text>
                    </v-card>
                </template>

                <template v-else-if="type?.title === 'Module Matrix'">
                    <div v-if="api_domains.length === 0 && !content_loading">No domains found for this project. Create Domains first</div>
                    <v-expansion-panels v-else class="mb-4">
                        <v-expansion-panel class="mb-1" v-for="(m, i) in content_json.modules_overview || []" :key="i">
                            <v-expansion-panel-title>
                                Module {{ i + 1 }}
                                <template v-slot:actions="{ expanded }">
                                    <div class="d-flex align-center">
                                        <v-icon
                                            v-if="formRef?.isValid == false && (!m.name || !m.domain_id || !m.priority || !m.phase)"
                                            color="error"
                                            icon="mdi-alert-circle"
                                        ></v-icon>
                                        <v-btn
                                            icon="mdi-delete"
                                            color="gray"
                                            variant="text"
                                            :loading="loading_delete === i"
                                            size="small"
                                            class="mx-2"
                                            @click="deleteModule(m, i)"
                                        />
                                        <v-icon
                                            :color="!expanded ? 'teal' : ''"
                                            :icon="expanded ? 'mdi-chevron-up' : 'mdi-menu-down'"
                                        ></v-icon>
                                    </div>
                                </template>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text eager class="pt-2">
                                <v-select
                                    :rules="requiredRule"
                                    :items="api_domains"
                                    item-value="id"
                                    item-title="name"
                                    label="Select Domain"
                                    v-model="m.domain_id"
                                ></v-select>
                                <v-text-field :rules="requiredRule" label="Module Name" v-model="m.name" />
                                <v-text-field :rules="requiredRule" label="Priority" v-model="m.priority" />
                                <v-text-field :rules="requiredRule" label="Phase" v-model="m.phase" />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-card-actions class="d-flex justify-center">
                            <v-btn
                                class="d-flex align-center"
                                color="primary"
                                variant="outlined"
                                @click="content_json.modules_overview.push({ name: '', domain_id: '', priority: '', phase: '' })"
                                >Add Module</v-btn
                            >
                        </v-card-actions>
                    </v-expansion-panels>
                </template>

                <template v-else-if="type?.title === 'Module Engineering'">
                    <v-combobox label="Module Names" v-model="content_json.modules_overview_names" multiple />
                    <v-combobox label="Domains" v-model="content_json.modules_overview_domains" multiple />
                    <v-combobox label="Priorities" v-model="content_json.modules_overview_priorities" multiple />
                    <v-combobox label="Phases" v-model="content_json.modules_overview_phases" multiple />
                </template>

                <template v-else-if="type?.title === 'System Architecture'">
                    <v-text-field class="mb-1" :rules="requiredRule" label="Auth Model" v-model="content_json.auth_model" />
                    <v-textarea class="mb-1" :rules="requiredRule" rows="3" label="API Style" v-model="content_json.api_style" />
                    <v-textarea
                        class="mb-1"
                        :rules="requiredRule"
                        rows="3"
                        label="Data Model Notes"
                        v-model="content_json.data_model_notes"
                    />
                    <v-textarea
                        class="mb-1"
                        :rules="requiredRule"
                        rows="3"
                        label="Scalability Notes"
                        v-model="content_json.scalability_notes"
                    />
                </template>
                <template v-else-if="type?.title === 'Phase Scope'">
                    <v-select
                        v-if="!content_loading"
                        :rules="requiredRule"
                        :items="api_modules"
                        item-value="id"
                        item-title="name"
                        label="Included Modules"
                        hint="Pick Modules"
                        multiple
                        v-model="content_json.included_modules"
                    ></v-select>
                    <div v-for="(e, i) in content_json.excluded_items || []" :key="i" class="d-flex ga-2 align-center mb-2">
                        <v-text-field :rules="requiredRule" :label="'Excluded Item ' + (i + 1)" v-model="content_json.excluded_items[i]" />
                        <v-btn
                            class="d-flex align-center"
                            icon="mdi-plus"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="content_json.excluded_items.push('')"
                            :style="{ visibility: i === content_json.excluded_items.length - 1 ? 'visible' : 'hidden' }"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            size="small"
                            @click="content_json.excluded_items.splice(i, 1)"
                            :disabled="content_json.excluded_items.length <= 1"
                        />
                    </div>
                    <div v-for="(e, i) in content_json.acceptance_criteria || []" :key="i" class="d-flex ga-2 align-center mb-2">
                        <v-text-field
                            :rules="requiredRule"
                            :label="'Acceptance Criteria ' + (i + 1)"
                            v-model="content_json.acceptance_criteria[i]"
                        />
                        <v-btn
                            class="d-flex align-center"
                            icon="mdi-plus"
                            color="primary"
                            variant="text"
                            size="small"
                            @click="content_json.acceptance_criteria.push('')"
                            :style="{ visibility: i === content_json.acceptance_criteria.length - 1 ? 'visible' : 'hidden' }"
                        ></v-btn>
                        <v-btn
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            size="small"
                            @click="content_json.acceptance_criteria.splice(i, 1)"
                            :disabled="content_json.acceptance_criteria.length <= 1"
                        />
                    </div>
                </template>
            </v-card-text>
        </v-card>
    </v-form>
    <v-snackbar v-model="snackbar" :timeout="3000">
        {{ error_message }}

        <template v-slot:actions>
            <v-btn color="blue" variant="text" @click="snackbar = false"> Close </v-btn>
        </template>
    </v-snackbar>
</template>
