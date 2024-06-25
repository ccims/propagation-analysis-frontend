<template>
    <div class="d-flex full-height flex-column">
        <div class="d-flex align-center my-3 ml-3 top-bar">
            <v-text-field
                v-model="searchString"
                label="Search"
                class="mr-2 search-field"
                prepend-inner-icon="mdi-magnify"
                clearable
            >
            </v-text-field>
            <slot name="search-append" />
            <div class="sort-container d-flex mr-3" :class="{ hidden: transformedSearchQuery != undefined, 'sort-container-small': sortFields.length <= 1 }">
                <v-select
                    v-if="sortFields.length > 1"
                    v-model="currentSortField"
                    label="Sort by"
                    class="ml-2"
                    :class="{ hidden: transformedSearchQuery != undefined }"
                    variant="outlined"
                    :items="sortFields"
                ></v-select>
                <v-btn class="ml-2" icon variant="outlined" @click="toggleSortDirection()">
                    <v-icon :icon="sortAscending ? 'mdi-sort-ascending' : 'mdi-sort-descending'" />
                    <v-tooltip activator="parent" location="bottom"> Toggle sort sort </v-tooltip>
                </v-btn>
            </div>
        </div>
        <div class="list-container flex-1-1 px-3">
            <div v-if="currentItems.length == 0 && loadedInitially" class="text-medium-emphasis">
                No {{ name }} found
            </div>
            <CustomList :items="currentItems" :to="to" @click="$emit('click', $event)">
                <template #item="{ item }">
                    <slot name="item" :item="item" />
                </template>
            </CustomList>
            <div
                v-if="pageCount > 1 && transformedSearchQuery == undefined"
                class="d-flex justify-center pagination-container"
            >
                <v-pagination v-model="currentPage" :length="pageCount" class="pagination flex-1-1"></v-pagination>
            </div>
        </div>
        <slot />
    </div>
</template>
<script setup lang="ts" generic="T, S extends string">
import { watch } from "vue";
import { Ref, onMounted } from "vue";
import { PropType, ref } from "vue";
import { RouteLocationRaw } from "vue-router";
import CustomList from "./CustomList.vue";
import { computed } from "vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

export interface ItemManager<I, J> {
    fetchItems(
        filter: string | undefined,
        sortField: J,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[I[], number]>;
}

const props = defineProps({
    sortFields: {
        type: Array as PropType<S[]>,
        required: true
    },
    sortAscendingInitially: {
        type: Boolean,
        default: true
    },
    itemManager: {
        type: Object as PropType<ItemManager<T, S>>,
        required: true
    },
    itemCount: {
        type: Number,
        required: false,
        default: 25
    },
    to: {
        type: Function as PropType<(item: T) => RouteLocationRaw | undefined>,
        required: true
    },
    dependencies: {
        type: Array as PropType<any[]>,
        required: false,
        default: () => []
    },
    name: {
        type: String,
        required: true
    }
});

defineEmits<{
    (event: "click", item: T): void;
}>()

const searchString = ref("");
const transformedSearchQuery = computed(() => transformSearchQuery(searchString.value));
const currentSortField = ref(props.sortFields[0]) as Ref<S>;
const sortAscending = ref(props.sortAscendingInitially);
const loadedInitially = ref(false);

const pageCount = ref(0);
const currentPage = ref(1);
const currentItems = ref<T[]>([]) as Ref<T[]>;

function toggleSortDirection() {
    sortAscending.value = !sortAscending.value;
}

onMounted(async () => {
    await updateItems(false);
});

watch([transformedSearchQuery, currentSortField, sortAscending], async () => {
    await updateItems(true);
});

watch(currentPage, async () => {
    await updateItems(false);
});

watch(
    () => props.dependencies,
    async () => {
        await updateItems(false);
    },
    { deep: true }
);

async function updateItems(resetPage: boolean) {
    if (resetPage) {
        currentPage.value = 1;
    }
    const [items, count] = await props.itemManager.fetchItems(
        transformedSearchQuery.value,
        currentSortField.value,
        sortAscending.value,
        props.itemCount,
        currentPage.value - 1
    );
    loadedInitially.value = true;
    currentItems.value = items;
    pageCount.value = Math.ceil(count / props.itemCount);
}
</script>
<style scoped>
.sort-container {
    flex: 0 1 300px;
    overflow-x: clip;
    transition: flex-basis 0.6s ease-in-out;
}

.sort-container.sort-container-small {
    flex-basis: 68px;
}

.sort-container.hidden {
    flex-basis: 0px;
}

.search-field {
    flex: 1 1 250px;
}

.top-bar :deep(.v-input__details) {
    display: none !important;
}

.list-container {
    overflow-y: auto;
}

.pagination {
    max-width: 600px;
}

.pagination-container {
    flex: 1 1 300px;
}
</style>
