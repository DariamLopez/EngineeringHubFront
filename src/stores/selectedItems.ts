import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { router } from '@/router';
import { CircleIcon } from 'vue-tabler-icons';

const STORAGE_KEY = 'selectedStore';

function loadFromSession() {
    try {
        const data = sessionStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function rehydrateModules(modules: any[]): any[] {
    if (!Array.isArray(modules)) return [];
    return modules.map((item) => {
        if (item.header) return item;
        return { ...item, icon: markRaw(CircleIcon) };
    });
}

function saveToSession(state: object) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useSelectedStore = defineStore('select', {
    state: () => {
        const saved = loadFromSession();
        return {
            project: (saved?.project ?? null) as {
                id: number;
                name: string;
                client: string;
                created_by: string;
                status: string;
                modules: [];
            } | null,
            artifact: (saved?.artifact ?? {
                title: 'Strategic Alignment',
                url: 'strategic_alignment',
                content: null
            }) as any,
            modules: rehydrateModules(saved?.modules ?? []),
            module: (saved?.module ?? {
                id: '',
                content: null
            }) as any,
            msg: '' as string | null,
            selectData: (saved?.selectData ?? 'artifact') as string | null
        };
    },
    actions: {
        selectProject(project: {id: number; name: string; client: string; created_by: string; status: string; modules?: [] }) {
            this.project = {
                ...project,
                modules: project.modules ?? []
            };
            saveToSession(this.$state);
            router.push(`/DetailsProject/${this.project?.name}/${this.artifact.url}`);
        },
        selectArtifact(artifact: { title: string; to: string }) {
            this.artifact.title = artifact.title;
            this.artifact.url = artifact.to;
            saveToSession(this.$state);
            router.push(`/DetailsProject/${this.project?.name}/${this.artifact.url}`);
        },
        selectModule(module: { id: number, name: string }) {
            this.module.id = module.id;
            saveToSession(this.$state);
            router.push(`/DetailsProject/${this.project?.name}/${module.name}`)
        },
        saveModules(modules: []) {
            this.modules = modules;
            saveToSession(this.$state);
        },
        clearModule() {
            this.module = { id: '', content: null };
            this.selectData = 'artifact';
            saveToSession(this.$state);
        },
       /*  assignModuleToProject() {
            if (this.module && this.project && !this.project.modules.includes(this.module)) {
                this.project.modules.push(this.module);
                this.msg = `Module assigned to ${this.project?.name}`;
                saveToSession(this.$state);
            } else {
                this.msg = 'There must be a project selected to assign this module';
            }
        } */
    }
});
