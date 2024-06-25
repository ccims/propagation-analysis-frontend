<template>
    <div class="sprotty-wrapper">
        <div :id="editorId" class="sprotty" />
        <Teleport
            v-if="selecteds.length == 1 && !propagationMode"
            :key="selected.id"
            :to="`#${selected.contextMenuContainerId}>.context-menu`"
        >
            <div class="context-menu ml-2" @mousedown.stop.prevent>
                <template
                    v-if="selected.contextMenuData.type == 'component' || selected.contextMenuData.type == 'interface'"
                >
                    <SmallFAB
                        class="d-block"
                        icon
                        color="primary-container"
                        :disabled="!selected.contextMenuData.createRelation"
                        @mousedown="() => modelSource!.startRelation(selected.id)"
                    >
                        <v-icon icon="mdi-arrow-top-right" />
                        <v-tooltip activator="parent">Create relation</v-tooltip>
                    </SmallFAB>
                </template>
                <template v-if="selected.contextMenuData.type == 'component'">
                    <SmallFAB
                        class="d-block mt-2"
                        icon
                        color="primary-container"
                        :disabled="!selected.contextMenuData.remove"
                        @mouseup="$emit('removeComponent', selected.id)"
                    >
                        <v-icon icon="mdi-close" />
                        <v-tooltip activator="parent">Remove component version from project</v-tooltip>
                    </SmallFAB>
                </template>
                <template v-if="selected.contextMenuData.type == 'component'">
                    <SmallFAB
                        class="d-block mt-2"
                        icon
                        color="primary-container"
                        @mouseup="$emit('showSidebarForComponent', selected.id)"
                    >
                        <v-icon icon="$issue" />
                        <v-tooltip activator="parent">Show issues</v-tooltip>
                    </SmallFAB>
                </template>
                <template v-if="selected.contextMenuData.type == 'relation'">
                    <SmallFAB
                        class="d-block"
                        icon
                        color="primary-container"
                        :disabled="!selected.contextMenuData.delete"
                        @mouseup="$emit('deleteRelation', selected.id)"
                    >
                        <v-icon icon="mdi-close" />
                        <v-tooltip activator="parent">Delete relation</v-tooltip>
                    </SmallFAB>
                </template>
            </div>
        </Teleport>
        <div class="ui-container full-height pa-3">
            <slot />
        </div>
    </div>
</template>
<script setup lang="ts">
import "reflect-metadata";
import {
    Graph,
    GraphLayout,
    GraphModelSource,
    SelectedElement,
    createContainer,
    CreateRelationContext
} from "@gropius/graph-editor";
import { TYPES } from "sprotty";
import { PropType, onMounted, shallowRef, watch, ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";

export interface GraphLayoutWrapper {
    layout: GraphLayout;
    resetViewport: boolean;
}

export type ContextMenuData =
    | {
          type: "component";
          remove: boolean;
          createRelation: boolean;
      }
    | {
          type: "interface";
          createRelation: boolean;
      }
    | {
          type: "relation";
          delete: boolean;
      };

const props = defineProps({
    graph: {
        type: Object as PropType<Graph>,
        required: true
    },
    layout: {
        type: Object as PropType<GraphLayoutWrapper>,
        required: true
    },
    propagationMode: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits<{
    (event: "update:layout", value: GraphLayout): void;
    (event: "removeComponent", value: string): void;
    (event: "createRelation", value: CreateRelationContext): void;
    (event: "deleteRelation", value: string): void;
    (event: "showSidebarForComponent", value: string): void;
    (event: "togglePropagationEdge", value: string): void;
}>();

class ModelSource extends GraphModelSource {
    protected handleCreateRelation(context: CreateRelationContext): void {
        emit("createRelation", context);
    }

    protected layoutUpdated(partialUpdate: GraphLayout, resultingLayout: GraphLayout): void {
        // TODO
    }

    protected handleSelectionChanged(selectedElements: SelectedElement<any>[]): void {
        for (const newSelected of selectedElements) {
            if (!selecteds.value.some((selected) => selected.id === newSelected.id)) {
                emit("togglePropagationEdge", newSelected.id);
            }
        }
        selecteds.value = selectedElements;
    }
}

const editorId = ref(`graph-editor-${uuidv4()}`);
const modelSource = shallowRef<ModelSource | undefined>();
const selecteds = ref<SelectedElement<ContextMenuData>[]>([]);
const selected = computed(() => selecteds.value[0]);

onMounted(async () => {
    const container = createContainer(editorId.value);
    container.bind(ModelSource).toSelf().inSingletonScope();
    container.bind(TYPES.ModelSource).toService(ModelSource);
    modelSource.value = container.get(ModelSource);
    modelSource.value!.updateGraph({ graph: props.graph, layout: props.layout.layout, fitToBounds: true });
});

watch(
    () => props.graph,
    () => {
        modelSource.value!.updateGraph({ graph: props.graph, fitToBounds: false });
    }
);
watch(
    () => props.layout,
    () => {
        modelSource.value!.updateGraph({ layout: props.layout.layout, fitToBounds: props.layout.resetViewport });
    }
);
</script>
<style scoped>
.sprotty-wrapper {
    height: 100%;
    position: relative;
}

.ui-container {
    position: absolute;
    top: 0;
    right: 0;
}

.context-menu {
    pointer-events: all;
}

/* Sprotty */
:deep(.sprotty) {
    display: flex;
    height: 100%;
}

:deep(.sprotty-hidden) {
    height: 0px !important;
}

:deep(.sprotty svg) {
    width: 100%;
    flex: 1;
    border-style: none;
    border-width: 0px;
    outline: none;
    --diagram-grid: rgba(var(--v-theme-on-surface), 0.2);
    --background-overlay-color: rgba(var(--v-theme-surface), 0.6);
    --shape-stroke-color: rgb(var(--v-theme-on-surface));
    --version-chip-background: rgb(var(--v-theme-primary-container));
    --version-chip-color: rgb(var(--v-theme-on-primary-container));
    --selected-shape-stroke-color: rgb(var(--v-theme-primary));
    --selected-shape-fill-color: rgba(var(--v-theme-primary), 0.4);
    --issue-closed-color: rgb(var(--v-theme-issue-closed));
    --issue-open-color: rgb(var(--v-theme-issue-open));
    --issue-relation-stroke-color: rgba(var(--v-theme-on-surface), 0.4);
    --highlight-stroke-color: rgb(var(--v-theme-primary));
    --highlight-fill-color: rgba(var(--v-theme-primary), 0.4);
    --propagation-shape-stroke-color-inactive: rgb(var(--v-theme-error));
    --propagation-shape-stroke-color-active: rgb(var(--v-theme-primary));
}
</style>
