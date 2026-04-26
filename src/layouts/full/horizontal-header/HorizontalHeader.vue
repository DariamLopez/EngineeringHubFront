<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';

// Icon Imports
import { GridDotsIcon, LanguageIcon, SearchIcon, Menu2Icon, BellRingingIcon, ShoppingCartIcon } from 'vue-tabler-icons';
import Logo from '../logo/Logo.vue';
// dropdown imports
import NotificationDD from '../vertical-header/NotificationDD.vue';
import ProfileDD from '../vertical-header/ProfileDD.vue';
import RightMobileSidebar from '../vertical-header/RightMobileSidebar.vue';
import ThemeToggler from '../vertical-header/ThemeToggler.vue';

const customizer = useCustomizerStore();
const appsdrawer = ref(false);
const priority = ref(customizer.setHorizontalLayout ? 0 : 0);
watch(priority, (newPriority) => {
    priority.value = newPriority;
});


</script>

<template>
    <v-app-bar elevation="0" :priority="priority" height="64" class="horizontal-header border border-bottom" color="surface">
        <div :class="customizer.boxed ? 'maxWidth v-toolbar__content px-lg-0 px-4' : 'v-toolbar__content px-6'">
            <div class="hidden-md-and-down">
                <Logo />
            </div>
            <v-btn class="hidden-md-and-up" icon variant="text" @click.stop="customizer.SET_SIDEBAR_DRAWER" size="small">
                <Menu2Icon size="25" />
            </v-btn>
            <!-- ------------------------------------------------>
            <!-- Search part -->
            <!-- ------------------------------------------------>
            

            <!---/Search part -->
            <v-spacer />
            <!-- ---------------------------------------------- -->
            <!---right part -->
            <!-- ---------------------------------------------- -->
            <ThemeToggler />
            <!-- ---------------------------------------------- -->
            <!-- translate -->
            <!-- ---------------------------------------------- -->
            

            <!-- ---------------------------------------------- -->
            <!-- ShoppingCart -->
            <!-- ---------------------------------------------- -->
            <div class="ms-2">
                <v-btn icon variant="text" color="primary" class="custom-hover-primary" to="/ecommerce/checkout" size="small">
                    <v-badge color="error" content="0" offset-x="-8" offset-y="-1">
                        <BasketIcon stroke-width="1.5" size="22" />
                    </v-badge>
                </v-btn>
            </div>

            <!-- right sidebar -->
            <div class="ms-2 hidden-lg-and-up">
                <v-btn variant="text" color="primary" size="small" class="custom-hover-primary" icon @click.stop="appsdrawer = !appsdrawer">
                    <GridDotsIcon size="22" stroke-width="1.5" />
                </v-btn>
            </div>
            <!-- Notification -->
            <!-- ---------------------------------------------- -->
            <div class="ms-2">
                <NotificationDD />
            </div>
            <!-- ---------------------------------------------- -->
            <!-- User Profile -->
            <!-- ---------------------------------------------- -->
            <div class="ml-2">
                <ProfileDD />
            </div>
        </div>
    </v-app-bar>

    <v-navigation-drawer v-model="appsdrawer" location="right" temporary>
        <RightMobileSidebar />
    </v-navigation-drawer>
</template>
