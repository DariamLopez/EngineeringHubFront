<script setup>
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useAuthStore } from '@/stores/auth';
import axiosServices from '@/utils/axios';
import { onMounted, ref } from 'vue';

const authStore = useAuthStore();

const page = ref({ title: 'Users List' });
const breadcrumbs = ref([
    { text: 'Home', disabled: false, href: '/' },
    { text: 'Users List', disabled: true, href: '#' }
]);

const loading = ref(false);
const updatingTable = ref(false);
const delete_loading = ref(false);
const delete_dialog = ref(false);
const search = ref('');

const users = ref([]);
const userHeaders = ref([
    { title: 'Name', align: 'start', key: 'name' },
    { title: 'Email', align: 'start', key: 'email' },
    { title: 'Role', align: 'start', key: 'role' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false }
]);
const userSelected = ref(null);

onMounted(async () => {
    loading.value = true;
    try {
        users.value = await getUsers();
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        loading.value = false;
    }
});
const deleteDialog = async (user) => {
    userSelected.value = user;
    delete_dialog.value = true;
};

const getUsers = async () => {
    const response = await axiosServices.get('/users').then((res) => {
        //console.log('API response for users:', res.data);
        res.data.forEach((user) => {
            user.role = user.roles && user.roles.length > 0 ? user.roles[0].name : 'No role';
        });
        return res;
    });
    return response.data;
};
const deleteUser = async (user) => {
    loading.value = true;
    delete_dialog.value = false;
    try {
        await axiosServices.delete(`/users/${user.id}`);
        users.value = users.value.filter((u) => u.id !== user.id);
    } catch (error) {
        console.error('Error deleting user:', error);
    }
    loading.value = false;
    userSelected.value = null;
};
</script>
<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Users">
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
                        <v-btn v-if="authStore.user.user.roles[0].name == 'admin'" to="/FormUser"> New User </v-btn>
                    </v-col>
                </v-row>
                <v-skeleton-loader v-if="loading" type="table"></v-skeleton-loader>
                <v-data-table
                    v-else
                    :loading="updatingTable"
                    items-per-page="5"
                    :headers="userHeaders"
                    :items="users"
                    :search="search"
                    class="border rounded-md"
                >
                    <!-- <template v-slot:item.name="{ item }">
                        <span class="mx-2">{{ item.name }}</span>
                        <v-tooltip :text="item.description ? item.description : 'No description available'">
                            <template v-slot:activator="{ props }">
                                <v-icon v-bind="props" size="20">mdi-alert-circle-outline</v-icon>
                            </template>
                        </v-tooltip>
                    </template> -->
                    <!-- Columna de acciones -->
                    <template v-slot:item.actions="{ item }">
                        <!-- <v-tooltip
                            v-if="authStore.user.user.roles[0].name == 'admin' || authStore.user.abilities.includes('edit_users')"
                            text="Edit User"
                        >
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="30" color="success" class="mr-1" @click="openEditDialog(item)">
                                    <v-icon style="font-size: 15px">mdi-pencil</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip> -->

                        <v-tooltip v-if="authStore.user.user.roles[0].name == 'admin'" text="Delete User">
                            <template v-slot:activator="{ props }">
                                <v-btn v-bind="props" icon size="30" color="error" class="mr-1" @click="deleteDialog(item)">
                                    <v-icon style="font-size: 15px">mdi-delete</v-icon>
                                </v-btn>
                            </template>
                        </v-tooltip>

                        <!-- <v-tooltip text="View Project Details">
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
                        </v-tooltip> -->
                    </template>
                </v-data-table>
            </UiParentCard>
        </v-col>
    </v-row>
    <v-dialog v-model="delete_dialog" max-width="400">
        <v-card>
            <v-card-title class="text-h6">Confirm deletion</v-card-title>
            <v-card-text>
                Are you sure you want to delete the user
                <strong>{{ userSelected.name }}</strong
                >? This action cannot be undone.
            </v-card-text>
            <v-card-actions class="d-flex justify-end">
                <v-btn variant="text" @click="delete_dialog = false">Cancel</v-btn>
                <v-btn color="error" variant="outlined" @click="deleteUser(userSelected)">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
