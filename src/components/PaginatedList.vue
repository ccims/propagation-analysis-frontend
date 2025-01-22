<template>
    <div class="d-flex h-100 flex-column">
        <div class="d-flex align-center mt-3 mb-2 ml-3 top-bar">
            <v-text-field
                v-model="searchString"
                label="Search"
                class="search-field"
                prepend-inner-icon="mdi-magnify"
                clearable
            >
            </v-text-field>
            <slot name="search-append" />
            <div
                class="sort-container d-flex mr-3"
                :class="{ hidden: transformedSearchQuery != undefined, 'sort-container-small': !multipleSortFields }"
            >
                <v-select
                    v-if="multipleSortFields"
                    v-model="currentSortField"
                    label="Sort by"
                    class="ml-2"
                    :class="{ hidden: transformedSearchQuery != undefined }"
                    variant="outlined"
                    :items="Object.keys(sortFields as Record<string, unknown>)"
                ></v-select>
                <v-btn icon variant="outlined" @click="toggleSortDirection()" class="ml-2">
                    <v-icon :icon="sortAscending ? 'mdi-sort-ascending' : 'mdi-sort-descending'" />
                    <v-tooltip activator="parent" location="bottom"> Toggle sort sort </v-tooltip>
                </v-btn>
            </div>
        </div>
        <div class="mx-3 mb-1">
            <slot name="additional-filter" />
        </div>
        <div class="overflow-y-auto flex-1-1 px-3">
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
<script setup lang="ts" generic="T, S extends string, K extends string">
import { watch } from "vue";
import { Ref, onMounted } from "vue";
import { PropType, ref } from "vue";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import CustomList from "./CustomList.vue";
import { computed } from "vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { WritableComputedRef } from "vue";
import { OrderDirection } from "@/graphql/generated";

export interface ItemManager<I, J> {
    fetchItems(
        filter: string | undefined,
        orderBy: { field: J; direction: OrderDirection }[],
        count: number,
        page: number
    ): Promise<[I[], number]>;
}

const props = defineProps({
    sortFields: {
        type: Object as PropType<Record<K, S | "ID" | (S | "ID")[]>>,
        required: true
    },
    sortAscendingInitially: {
        type: Boolean,
        default: true
    },
    itemManager: {
        type: Object as PropType<ItemManager<T, S | "ID">>,
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
    },
    queryParamPrefix: {
        type: String,
        required: false
    }
});

defineEmits<{
    (event: "click", item: T): void;
}>();

const route = useRoute();
const router = useRouter();

const queryMode = computed(() => props.queryParamPrefix != undefined);
const multipleSortFields = computed(() => Object.keys(props.sortFields as Record<K, unknown>).length > 1);

const searchString = useQueryParam(
    "search",
    "",
    (value) => value,
    (value) => value
);
const transformedSearchQuery = computed(() => transformSearchQuery(searchString.value));
const currentSortField = useQueryParam<K>(
    "sort",
    Object.keys(props.sortFields as Record<K, unknown>)[0] as K,
    (value) => value as K,
    (value) => value
);
const sortAscending = useQueryParam(
    "asc",
    props.sortAscendingInitially,
    (value) => value == "true",
    (value) => value.toString()
);
const loadedInitially = ref(false);

const pageCount = ref(0);
const currentPage = useQueryParam(
    "page",
    1,
    (value) => parseInt(value),
    (value) => value.toString()
);
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
    const sortField: S | S[] | "ID" = (props.sortFields as Record<K, S | S[]>)[currentSortField.value];
    const sortFields = Array.isArray(sortField) ? sortField : [sortField];
    const sortFieldsWithId = sortFields.includes("ID") ? sortFields : ([...sortFields, "ID"] as const);

    const [items, count] = await props.itemManager.fetchItems(
        transformedSearchQuery.value,
        sortFieldsWithId.map((field) => ({
            field,
            direction: sortAscending.value ? OrderDirection.Asc : OrderDirection.Desc
        })),
        props.itemCount,
        currentPage.value - 1
    );
    loadedInitially.value = true;
    currentItems.value = items;
    pageCount.value = Math.ceil(count / props.itemCount);
}

function useQueryParam<T>(
    key: string,
    initialValue: T,
    parse: (value: string) => T,
    stringify: (value: T) => string
): WritableComputedRef<T> {
    const _value = ref<T>(initialValue) as Ref<T>;
    return computed<T>({
        get: () => {
            if (queryMode.value) {
                const value = route.query[props.queryParamPrefix + key];
                if (value) {
                    return parse(value as string);
                } else {
                    return initialValue;
                }
            }
            return _value.value;
        },
        set: (value: T) => {
            if (queryMode.value != undefined) {
                updateQuery(key, value === "" ? undefined : stringify(value));
            } else {
                _value.value = value;
            }
        }
    });
}

function updateQuery(key: string, value: string | undefined) {
    router.replace({
        query: {
            ...route.query,
            [props.queryParamPrefix + key]: value
        }
    });
}
</script>
<style scoped>
.sort-container {
    flex: 0 1 300px;
    overflow-x: clip;
    min-width: 0;
    transition: flex-basis 0.6s ease-in-out;
}

.sort-container.hidden.sort-container-small,
.sort-container.hidden {
    flex-basis: 0px;
}

.search-field {
    flex: 1 1 250px;
}

.top-bar :deep(.v-input__details) {
    display: none !important;
}

.pagination {
    max-width: 600px;
}

.pagination-container {
    flex: 1 1 300px;
}

.sort-container.sort-container-small {
    flex-basis: 56px;
}
</style>
