<script setup>
import { ref } from 'vue';

import SelectStatus from './Select-elements/select/SelectStatus.vue';
import { useRouter } from 'vue-router';
import axiosServices from '@/utils/axios';

const router = useRouter();

const name = ref('');
const client_name = ref('');
const status = ref('');
const created_by = ref('');
const description = ref('');

const requiredRule = (v) => !!v || 'This field is required';
const minLengthRule = (min) => (v) => (v && v.length >= min) || `Must be at least ${min} characters`;
const onlyLettersRule = (v) => /^[A-Za-z\s]+$/.test(v) || 'Letters only allowed';

const formRef = ref(null);

const handleSubmit = async () => {
    const isValid = formRef.value.isValid;
    if (!isValid) {
        //console.log('Invalid form');
        return
    } else {
        try {
            const response = await axiosServices.post('/projects', {
                name: name.value,
                client_name: client_name.value,
                description: description.value
            });
            //console.log('Project created:', response.data);
            router.push('/');
        } catch (error) {
            console.error('Error creating project:', error.response?.data || error.message);
        }
        /* console.log('Project created');
        router.back(); */
    }
};
</script>

<template>
    <v-form ref="formRef">
        <v-row>
            <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Project Name</v-label>
                <VTextField type="text" placeholder="John Deo" v-model="name" :rules="[requiredRule, minLengthRule(3)]"></VTextField>
            </v-col>
            <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Client Name</v-label>
                <VTextField type="text" placeholder="Jane Deo" v-model="client_name" :rules="[requiredRule, onlyLettersRule]"></VTextField>
            </v-col>
            <!-- <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Status</v-label>
                <SelectStatus v-model="status" :rules="[requiredRule]" />
            </v-col> -->
            <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Project Description</v-label>
                <v-textarea
                    placeholder="Project Description"
                    row-height="25"
                    rows="3"
                    variant="outlined"
                    auto-grow
                    v-model="description"
                ></v-textarea>
            </v-col>
            <v-card-actions class="flex-grow-1">
                <v-row>
                    <v-col cols="6" class="d-flex justify-start">
                        <v-btn @click="$router.back()">Back</v-btn>
                    </v-col>
                    <v-col cols="6" class="d-flex justify-end">
                        <v-btn @click="handleSubmit" color="primary" flat>Create Project</v-btn>
                    </v-col>
                </v-row>
            </v-card-actions>
        </v-row>
    </v-form>
</template>
