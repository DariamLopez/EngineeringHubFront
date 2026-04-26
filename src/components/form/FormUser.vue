<script setup>
import axiosServices from '@/utils/axios';
import { onMounted, ref } from 'vue';

const props = defineProps({
    is_create: {
        type: Boolean,
        default: true
    }
});
const requiredRule = (v) => !!v || 'This field is required';
const minLengthRule = (min) => (v) => (v && v.length >= min) || `Must be at least ${min} characters`;
const onlyLettersRule = (v) => /^[A-Za-z\s]+$/.test(v) || 'Letters only allowed';

const formRef = ref(null);
const name = ref('');
const email = ref('');
const password = ref('');
const roles = ref('');

const roles_data = ref([]);
const loading = ref(false);
const loadingRoles = ref(false);

const handleSubmit = () => {
    const isValid = formRef.value.isValid;
    if (!isValid) {
        //console.log('Invalid form');
        return
    } else {
        submitUser();
    }
};
const getRoles = async () => {
    const response = await axiosServices.get('/roles').
    catch((error) => {
        console.error('Error fetching roles:', error);
        return { data: [] }; // Return empty array on error
    });
    //console.log('Roles fetched:', response.data);
    return response.data;
};
const submitUser = async () => {
    loading.value = true;
    try {
        const response = await axiosServices.post('/register', {
            name: name.value,
            email: email.value,
            password: props.is_create ? password.value : null,
            roles: roles.value
        });
        //console.log('User created:', response.data);
    } catch (error) {
        console.error('Error creating user:', error.response?.data || error.message);
    } finally {
        name.value = '';
        email.value = '';
        password.value = '';
        roles.value = '';
        loading.value = false;
    }
};
onMounted(async () => {
    loadingRoles.value = true;
    roles_data.value = await getRoles();
    loadingRoles.value = false;
});
</script>
<template>
    <v-form ref="formRef">
        <v-row>
            <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Name</v-label>
                <VTextField :rules="[requiredRule, minLengthRule(3), onlyLettersRule]" v-model="name" type="text" placeholder="John Deo"></VTextField>
            </v-col>
            <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Email</v-label>
                <VTextField :rules="[requiredRule, minLengthRule(5)]" v-model="email" type="email" placeholder="john.doe@example.com"></VTextField>
            </v-col>
            <v-col cols="12">
                <v-label class="font-weight-medium mb-2">Role</v-label>
                <VSelect :rules="[requiredRule]" v-model="roles" :items="roles_data" item-title="name" item-value="name" placeholder="Select Role" :loading="loadingRoles"></VSelect>
            </v-col>
            <v-col v-if="props.is_create">
                <v-label class="font-weight-medium mb-2">Password</v-label>
                <VTextField :rules="[requiredRule, minLengthRule(6)]" v-model="password" type="password" placeholder="Enter password"></VTextField>
            </v-col>
           <!--  <v-col v-if="$props.is_create">
                <v-label class="font-weight-medium mb-2">Confirm Password</v-label>
                <VTextField :rules="[requiredRule, minLengthRule(6)]" v-model="password" type="password" placeholder="Confirm password"></VTextField>
            </v-col> -->
        </v-row>
        <v-card-actions class="d-flex justify-space-between">
            <v-btn @click="$router.back()">Back</v-btn>
            <v-btn @click="handleSubmit" :loading="loading" color="primary" class="ma-2">Submit</v-btn>
        </v-card-actions>
    </v-form>
</template>
