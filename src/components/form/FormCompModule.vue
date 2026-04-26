<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSelectedStore } from '@/stores/selectedItems';
import axios from 'axios';
import axiosServices from '@/utils/axios';
import { id } from 'date-fns/locale';

const router = useRouter();
const selectedStore = useSelectedStore();
const modules = ref([]);
const content_loading = ref(false);
const error_message = ref('');
const snackbar = ref(false);

// Module fields
const inputs = ref(
    Array.isArray(selectedStore.module?.content?.inputs) && selectedStore.module.content.inputs.length > 0
        ? selectedStore.module.content.inputs
        : ['']
);
const data_structure = ref(
    Array.isArray(selectedStore.module?.content?.data_structure) && selectedStore.module.content.data_structure.length > 0
        ? selectedStore.module.content.data_structure
        : ['']
);
const outputs = ref(
    Array.isArray(selectedStore.module?.content?.outputs) && selectedStore.module.content.outputs.length > 0
        ? selectedStore.module.content.outputs
        : ['']
);
const objective = ref(selectedStore.module?.content?.objective || '');
const logic_rules = ref(selectedStore.module?.content?.logic_rules || '');
const responsibility = ref(selectedStore.module?.content?.responsibility || '');
const failure_scenarios = ref(selectedStore.module?.content?.failure_scenarios || '');
const audit_trail_requirements = ref(selectedStore.module?.content?.audit_trail_requirements || '');
const dependencies = ref(selectedStore.module?.content?.dependencies || []);
const version_note = ref(selectedStore.module?.content?.version_note || '');

onMounted(async () => {
    content_loading.value = true;
    modules.value = await getModules();
    content_loading.value = false;
});
// Validation rules
const requiredRule = (v) => !!v || 'This field is required';
const minLengthRule = (min) => (v) => (v && v.length >= min) || `Must have at least ${min} characters`;
const minLengthNullableRule = (min) => (v) => !v || v.length >= min || `Must have at least ${min} characters`;

const formRef = ref(null);

// Module validation rule
const canValidate = () => {
    return objective.value.trim() !== '' && inputs.value.length > 0 && outputs.value.length > 0 && responsibility.value.trim() !== '';
};

const handleSubmit = async () => {
    const { valid } = await formRef.value?.validate();
    console.log('Form validation result:', valid);
    if (!valid) return false;
    const status = selectedStore.module.content.status || 'draft';
    let module_traited = {
        status: status,
        id: selectedStore.module.content.id,
        objective: objective.value,
        inputs: inputs.value.filter((v) => v !== ''),
        data_structure: data_structure.value.filter((v) => v !== ''),
        logic_rules: logic_rules.value,
        outputs: outputs.value.filter((v) => v !== ''),
        responsibility: responsibility.value,
        failure_scenarios: failure_scenarios.value,
        audit_trail_requirements: audit_trail_requirements.value,
        dependencies: dependencies.value,
        version_note: version_note.value
    };
    const result = await updateModule(module_traited);
    if (result === null) return false;
    router.back();
    return true;
};
defineExpose({
    handleSubmit
});
const getModules = async () => {
    const response = await axiosServices
        .get('/modules', {
            params: {
                project_id: selectedStore.project.id
            }
        })
        .then((res) => {
            console.log('Modules fetched:', res.data);
            return res.data;
        })
        .catch((err) => {
            console.error('Error fetching modules:', err);
            return [];
        });
    return response;
};
const updateModule = async (module) => {
    const response = await axiosServices
        .put(`/modules/${module.id}`, module)
        .then((res) => {
            //console.log('Module updated:', res.data);
            return res.data;
        })
        .catch((err) => {
            error_message.value = err.response?.data?.message;
            console.error('Error updating module:', error_message.value);
            snackbar.value = true;
            return null;
        });
    return response;
};
</script>

<template>
    <v-form ref="formRef">
        <v-row>
            <v-col class="pt-0 pb-2" cols="12">
                <VTextField
                    v-model="objective"
                    label="Objective"
                    placeholder="Enter module objective"
                    :rules="[minLengthNullableRule(5)]"
                />
            </v-col>
            <v-col class="pt-0 pb-2" cols="12">
                <VTextField
                    :rules="[minLengthNullableRule(5)]"
                    label="Logic Rules"
                    v-model="logic_rules"
                    placeholder="Enter business logic rules"
                />
            </v-col>
            <v-col class="pt-0 pb-2" cols="12">
                <VTextField
                    v-model="responsibility"
                    placeholder="Enter responsible team or owner"
                    :rules="[minLengthNullableRule(5)]"
                    label="Responsibility"
                />
            </v-col>
            <v-col class="py-0 pb-2" cols="12">
                <VTextField
                    v-model="failure_scenarios"
                    placeholder="Possible failure scenarios"
                    label="Failure Scenarios"
                    :rules="[minLengthNullableRule(5)]"
                />
            </v-col>
            <v-col class="py-0 pb-2" cols="12">
                <VTextField
                    :rules="[minLengthNullableRule(5)]"
                    v-model="audit_trail_requirements"
                    placeholder="Audit trail requirements"
                    label="Audit Trail Requirements"
                />
            </v-col>
            <v-col class="py-0" cols="12">
                <VTextField
                    v-model="version_note"
                    placeholder="Enter version note"
                    :rules="[minLengthNullableRule(5)]"
                    label="Version Note"
                />
            </v-col>
            <v-col class="py-0 pb-2" cols="12">
                <!--<VTextField v-model="dependencies" placeholder="Example: moduleA, moduleB" hide-details="auto" />-->
                <v-select
                    :loading="content_loading"
                    :items="modules"
                    item-value="id"
                    item-title="name"
                    label="Modules Dependencies"
                    hint="Pick Modules"
                    multiple
                    v-model="dependencies"
                ></v-select>
            </v-col>
            <v-col class="py-0" cols="12">
                <v-label class="font-weight-medium pb-2">Inputs</v-label>
                <!-- <VTextField v-model="inputs" label="Inputs" placeholder="Example: input1, input2" :rules="[requiredRule]" /> -->
                <div v-for="(o, i) in inputs || []" :key="i" class="d-flex ga-2 align-center mb-2">
                    <v-text-field :rules="[minLengthNullableRule(5)]" :label="`Input No: ${i + 1}`" v-model="inputs[i]" />
                    <v-btn
                        class="d-flex align-center"
                        icon="mdi-plus"
                        color="primary"
                        variant="text"
                        size="small"
                        @click="inputs.push('')"
                        :style="{ visibility: i === inputs.length - 1 ? 'visible' : 'hidden' }"
                    ></v-btn>
                    <v-btn
                        icon="mdi-delete"
                        color="error"
                        variant="text"
                        size="small"
                        @click="inputs.splice(i, 1)"
                        :disabled="inputs.length <= 1"
                    />
                </div>
            </v-col>
            <v-col class="py-0" cols="12">
                <v-label class="font-weight-medium pb-2">Data Structure</v-label>
                <!-- <VTextField v-model="data_structure" placeholder="Describe data structure or JSON" hide-details="auto" /> -->
                <div v-for="(o, i) in data_structure || []" :key="i" class="d-flex ga-2 align-center mb-2">
                    <v-text-field :rules="[minLengthNullableRule(5)]" :label="`Data Structure`" v-model="data_structure[i]" />
                    <v-btn
                        class="d-flex align-center"
                        icon="mdi-plus"
                        color="primary"
                        variant="text"
                        size="small"
                        @click="data_structure.push('')"
                        :style="{ visibility: i === data_structure.length - 1 ? 'visible' : 'hidden' }"
                    ></v-btn>
                    <v-btn
                        icon="mdi-delete"
                        color="error"
                        variant="text"
                        size="small"
                        @click="data_structure.splice(i, 1)"
                        :disabled="data_structure.length <= 1"
                    />
                </div>
            </v-col>
            <v-col class="py-0" cols="12">
                <v-label class="font-weight-medium pb-2">Outputs</v-label>
                <!-- <VTextField v-model="outputs" placeholder="Example: output1, output2" :rules="[requiredRule]" hide-details="auto" /> -->
                <div v-for="(o, i) in outputs || []" :key="i" class="d-flex ga-2 align-center mb-2">
                    <v-text-field :rules="[minLengthNullableRule(5)]" :label="`Output No: ${i + 1}`" v-model="outputs[i]" />
                    <v-btn
                        class="d-flex align-center"
                        icon="mdi-plus"
                        color="primary"
                        variant="text"
                        size="small"
                        @click="outputs.push('')"
                        :style="{ visibility: i === outputs.length - 1 ? 'visible' : 'hidden' }"
                    ></v-btn>
                    <v-btn
                        icon="mdi-delete"
                        color="error"
                        variant="text"
                        size="small"
                        @click="outputs.splice(i, 1)"
                        :disabled="outputs.length <= 1"
                    />
                </div>
            </v-col>
        </v-row>
    </v-form>
    <v-snackbar v-model="snackbar" :timeout="3000">
        {{ error_message }}

        <template v-slot:actions>
            <v-btn color="blue" variant="text" @click="snackbar = false"> Close </v-btn>
        </template>
    </v-snackbar>
</template>
