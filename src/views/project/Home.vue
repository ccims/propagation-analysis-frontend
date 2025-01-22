<template>
    <GraphEditor
        v-if="graph != undefined && layout != undefined"
        v-model:layout="layout"
        :graph="graph"
        :propagation-mode="propagationMode"
        @update:selected="selectedElement = $event"
        @update:layout="hasLayoutChanges = true"
        @remove-component="removeComponentVersion"
        @create-relation="beginCreateRelation"
        @delete-relation="deleteRelation"
        @add-interface="addInterface"
        @navigate-to="navigateTo"
        @toggle-propagation-edge="togglePropagationEdge"
    >
        <div class="w-100 h-100 d-flex">
            <div class="flex-grow-1 d-flex flex-column">
                <div class="d-flex align-center">
                    <ViewAutocomplete
                        v-model="view"
                        placeholder="No view selected"
                        persistent-placeholder
                        hide-details
                        :project="trackableId"
                        :initial-items="currentView != undefined ? [currentView] : []"
                        clearable
                        class="pointer-events-all view-autocomplete bg-surface"
                    />
                    <template v-if="hasLayoutChanges || hasFilterChanges">
                        <IconButton class="pointer-events-all ml-2" @click="updateLayoutOrView">
                            <v-icon icon="mdi-content-save" />
                            <v-tooltip activator="parent" location="bottom">{{
                                view == undefined ? "Save layout" : "Update view"
                            }}</v-tooltip>
                        </IconButton>
                        <IconButton class="pointer-events-all ml-1" @click="createView">
                            <v-icon icon="mdi-content-save-plus" />
                            <v-tooltip activator="parent" location="bottom">Save as view</v-tooltip>
                        </IconButton>
                    </template>
                </div>
                <div class="d-flex flex-wrap ga-2 mt-2 align-self-start">
                    <FilterChip
                        v-for="template in componentTemplates"
                        :key="template.id"
                        :model-value="componentTemplateFilter.has(template.id)"
                        @update:model-value="
                            $event
                                ? componentTemplateFilter.add(template.id)
                                : componentTemplateFilter.delete(template.id)
                        "
                        :label="template.name"
                        icon="mdi-filter-off"
                        class="pointer-events-all"
                    />
                </div>
            </div>
            <v-spacer />
            <div class="d-flex flex-column h-100 flex-shrink-0">
                <div class="d-flex">
                    <v-spacer />
                    <div class="pointer-events-all">
                        <FilterChip
                            v-model="showOpenIssues"
                            label="Open Issues"
                            icon="$issue"
                            class="mr-2 open-issue-chip"
                        />
                        <FilterChip
                            v-model="showClosedIssues"
                            label="Closed Issues"
                            icon="$issue"
                            class="mr-2 closed-issue-chip"
                        />
                        <FilterChip v-model="showIssueRelations" label="Issue Relations" />
                    </div>
                </div>
                <ProjectSidebar
                    v-model="selectedElement"
                    v-model:selected-characteristics="selectedCharacteristics"
                    :propagation-issue="propagationIssue"
                    @update:propagation-issue="
                        (issue?: Issue) => {
                            if (issue == undefined) {
                                propagationIssue = undefined;
                            } else {
                                propagateIssue(issue);
                            }
                        }
                    "
                    :original-graph="originalGraph ?? undefined"
                    :propagation-data="propagationData"
                    @create-issue="createIssue"
                    @propagate-issue="propagateIssue"
                    @close-propagation="propagationIssue = undefined"
                />
            </div>
        </div>
    </GraphEditor>
    <v-dialog v-model="showAddComponentVersionDialog" :scrim="false" width="auto" class="autocomplete-dialog">
        <v-sheet :elevation="10">
            <ComponentVersionAutocomplete
                hide-details
                autofocus
                auto-select-first
                bg-color="background"
                menu-mode="repeating"
                create-new
                create-new-context
                @selected-item="addComponentVersion"
                @create-new="createComponentVersion"
                @create-new-context="createComponent"
            />
        </v-sheet>
    </v-dialog>
    <v-dialog v-model="showSelectRelationTemplateDialog" :scrim="false" width="auto" class="autocomplete-dialog">
        <v-sheet :elevation="10">
            <RelationTemplateAutocomplete
                hide-details
                autofocus
                auto-select-first
                bg-color="background"
                menu-mode="initial"
                :menu-delay="350"
                :relation-template-filter="relationTemplateFilter"
                @selected-item="createRelation"
            />
        </v-sheet>
    </v-dialog>
    <v-dialog
        v-if="interfaceSpecificationComponent != undefined"
        v-model="showAddInterfaceDialog"
        :scrim="false"
        width="auto"
        class="autocomplete-dialog"
    >
        <v-sheet :elevation="10">
            <InterfaceSpecificationVersionAutocomplete
                hide-details
                autofocus
                auto-select-first
                bg-color="background"
                menu-mode="repeating"
                create-new
                create-new-context
                :menu-delay="350"
                :component="interfaceSpecificationComponent.component"
                @selected-item="addInterfaceSpecificationVersion"
                @create-new="createInterfaceSpecificationVersion"
                @create-new-context="createInterfaceSpecification"
            />
        </v-sheet>
    </v-dialog>
    <CreateViewDialog
        :project="trackableId"
        :templates="componentTemplates"
        :initial-templates="
            componentTemplateFilter.size == componentTemplates.length ? [] : [...componentTemplateFilter]
        "
        :layouts="cachedNewLayout"
        @created-view="view = $event.id"
    />
    <CreateComponentDialog
        :initial-name="initialComponentName"
        force-create-version
        @created-component="(_, version) => addComponentVersion(version!)"
    />
    <CreateComponentVersionDialog
        v-if="componentVersionComponent"
        :component="componentVersionComponent"
        :initial-version="initialComponentVersionVersion"
        @created-component-version="addComponentVersion"
    />
    <CreateInterfaceSpecificationDialog
        v-if="interfaceSpecificationComponent != undefined"
        :component="interfaceSpecificationComponent.component"
        :initial-name="initialInterfaceSpecificationName"
        force-create-version
        @created-interface-specification="(_, version) => addInterfaceSpecificationVersion(version!)"
    />
    <CreateInterfaceSpecificationVersionDialog
        v-if="interfaceSpecificationVersionInterfaceSpecificaton"
        :interface-specification="interfaceSpecificationVersionInterfaceSpecificaton"
        :initial-version="initialInterfaceSpecificationVersionVersion"
        @created-interface-specification-version="addInterfaceSpecificationVersion"
    />
</template>
<script lang="ts" setup>
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    GraphRelationPartnerTemplateInfoFragment,
    GraphRelationPartnerInfoFragment,
    GraphComponentVersionInfoFragment,
    GraphRelationTemplateInfoFragment,
    RelationTemplateFilterInput,
    Point,
    UpdateViewInput,
    IssueListItemInfoFragment,
    IssueOrderField,
    OrderDirection,
    Trackable,
    IssueOrder
} from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import GraphEditor, { ContextMenuData } from "@/components/GraphEditor.vue";
import {
    Graph,
    ShapeStyle,
    StrokeStyle,
    FillStyle,
    ComponentVersion,
    IssueType,
    Interface,
    Relation,
    RelationStyle,
    IssueRelation,
    GraphLayout,
    LayoutEngine,
    CreateRelationContext,
    SelectedElement
} from "@gropius/graph-editor";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { onEvent } from "@/util/eventBus";
import FilterChip from "@/components/input/FilterChip.vue";
import ComponentVersionAutocomplete from "@/components/input/ComponentVersionAutocomplete.vue";
import { inject } from "vue";
import { eventBusKey } from "@/util/keys";
import RelationTemplateAutocomplete from "@/components/input/RelationTemplateAutocomplete.vue";
import { IdObject } from "@/util/types";
import ProjectSidebar, { PropagationData } from "@/components/ProjectSidebar.vue";
import ViewAutocomplete from "@/components/input/ViewAutocomplete.vue";
import CreateViewDialog from "@/components/dialog/CreateViewDialog.vue";
import CreateComponentDialog from "@/components/dialog/CreateComponentDialog.vue";
import CreateComponentVersionDialog from "@/components/dialog/CreateComponentVersionDialog.vue";
import InterfaceSpecificationVersionAutocomplete from "@/components/input/InterfaceSpecificationVersionAutocomplete.vue";
import CreateInterfaceSpecificationDialog from "@/components/dialog/CreateInterfaceSpecificationDialog.vue";
import CreateInterfaceSpecificationVersionDialog from "@/components/dialog/CreateInterfaceSpecificationVersionDialog.vue";
import { ItemManager } from "@/components/PaginatedList.vue";
import { Component, PropagatedIssue } from "@/util/propagation/issueModel";
import { defaultPropagationConfig } from "@/util/propagation/defaultPropagationConfig";
import { extractCharacteristics, propagateIssues } from "@/util/propagation/propagation";
import { testPropagation } from "@/util/propagation/scoreCalculation";

type ProjectGraph = NodeReturnType<"getProjectGraph", "Project">;
type GraphLayoutSource = Pick<ProjectGraph, "relationLayouts" | "relationPartnerLayouts">;

const client = useClient();
const route = useRoute();
const router = useRouter();
const eventBus = inject(eventBusKey);

const trackableId = computed(() => route.params.trackable as string);
const graphVersionCounter = ref(0);

const view = ref<string | null>();
const hasLayoutChanges = ref(false);

const evaluating = ref(false);
const originalGraph = computedAsync(
    async () => {
        graphVersionCounter.value;
        if (!trackableId.value) {
            return null;
        }
        const graph = await withErrorMessage(
            async () => (await client.getProjectGraph({ project: trackableId.value })).node as ProjectGraph,
            "Error loading project graph"
        );
        return graph;
    },
    null,
    { shallow: false, evaluating }
);

const componentTemplates = computed(() => {
    const templateLookup = new Map<string, { id: string; name: string }>();
    for (const componentVersion of originalGraph.value?.components?.nodes ?? []) {
        const template = componentVersion.component.template;
        templateLookup.set(template.id, { id: template.id, name: template.name });
    }
    const templates = [...templateLookup.values()];
    templates.sort((a, b) => a.name.localeCompare(b.name));
    return templates;
});

const currentView = computedAsync(
    async () => {
        const viewId = view.value;
        if (viewId == undefined) {
            return null;
        }
        const currentView = await withErrorMessage(
            async () => (await client.getView({ id: viewId })).node as NodeReturnType<"getView", "View">,
            "Error loading view"
        );
        return currentView;
    },
    null,
    { shallow: false }
);

async function layoutGraph(graphLayout: GraphLayoutSource) {
    if (graphLayout.relationLayouts.nodes.length > 0 || graphLayout.relationPartnerLayouts.nodes.length > 0) {
        const resultingLayout: GraphLayout = {};
        for (const relationLayout of graphLayout.relationLayouts.nodes) {
            resultingLayout[relationLayout.relation.id] = {
                points: relationLayout.points
            };
        }
        for (const relationPartnerLayout of graphLayout.relationPartnerLayouts.nodes) {
            resultingLayout[relationPartnerLayout.relationPartner.id] = {
                pos: relationPartnerLayout.pos
            };
        }
        layout.value = resultingLayout;
    } else {
        layout.value = await autolayout(graph.value!);
    }
}

const componentTemplateFilter = ref<Set<string>>(new Set());

watch(originalGraph, async (value) => {
    if (view.value === undefined) {
        view.value = value?.defaultView?.id ?? null;
    }
    if (value != undefined && value.defaultView == undefined) {
        if (componentTemplateFilter.value.size == 0) {
            componentTemplateFilter.value = new Set(componentTemplates.value.map((template) => template.id));
        } else {
            const currentFilter = componentTemplateFilter.value;
            componentTemplateFilter.value = new Set(
                componentTemplates.value
                    .filter((template) => currentFilter.has(template.id))
                    .map((template) => template.id)
            );
        }
    }
    if (layout.value == undefined) {
        if (value?.defaultView == undefined) {
            await layoutGraph(value!);
        }
    }
});

watch(currentView, async (value) => {
    if (value != undefined) {
        if (value.filterByTemplate.nodes.length > 0) {
            componentTemplateFilter.value = new Set(value.filterByTemplate.nodes.map((template) => template.id));
        } else {
            componentTemplateFilter.value = new Set(componentTemplates.value.map((template) => template.id));
        }
        await layoutGraph(value);
    } else {
        componentTemplateFilter.value = new Set(componentTemplates.value.map((template) => template.id));
        await layoutGraph(originalGraph.value!);
    }
});

const hasFilterChanges = computed(() => {
    const view = currentView.value;
    const allTemplates = componentTemplateFilter.value.size == componentTemplates.value.length;
    if (view != undefined) {
        const viewFilter = view.filterByTemplate.nodes;
        if (viewFilter.length == 0) {
            return !allTemplates;
        } else {
            return (
                viewFilter.length != componentTemplateFilter.value.size ||
                !viewFilter.every((template) => componentTemplateFilter.value.has(template.id))
            );
        }
    } else {
        return !allTemplates;
    }
});

interface RelationPartnerLookupEntry {
    template: string;
    componentVersion: ProjectGraph["components"]["nodes"][number];
    interfaceDefinition?: ProjectGraph["components"]["nodes"][number]["interfaceDefinitions"]["nodes"][number];
}

const relationPartnerLookup = computed<Map<string, RelationPartnerLookupEntry>>(() => {
    const res = new Map<string, RelationPartnerLookupEntry>();
    if (originalGraph.value != undefined) {
        originalGraph.value.components.nodes.forEach((component) => {
            res.set(component.id, {
                template: component.component.template.id,
                componentVersion: component
            });
            component.interfaceDefinitions.nodes.forEach((definition) => {
                if (definition.visibleInterface != undefined) {
                    res.set(definition.visibleInterface.id, {
                        template: definition.interfaceSpecificationVersion.interfaceSpecification.template.id,
                        componentVersion: component,
                        interfaceDefinition: definition
                    });
                }
            });
        });
    }
    return res;
});

const showOpenIssues = ref(true);
const showClosedIssues = ref(false);
const showIssueRelations = ref(true);
const selectedElement = ref<SelectedElement<ContextMenuData> | undefined>(undefined);

// region propagation stuff
type Issue = IssueListItemInfoFragment;

const propagationComponent = ref<ComponentVersion>();
const propagationIssue = ref<Issue>();

const propagationMode = computed(() => {
    return propagationIssue.value != undefined;
});

const propagationWindow = computed(() => {
    return propagationMode.value ? 1 : 0;
});

const sortFields = {
    Updated: IssueOrderField.LastUpdatedAt
};

const itemManager: ItemManager<Issue, IssueOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: IssueOrder[],
        count: number,
        page: number
    ): Promise<[Issue[], number]> {
        if (filter == undefined) {
            const res = await client.getIssueList({
                orderBy,
                count,
                skip: page * count,
                trackable: propagationComponent.value!.componentId
            });
            const issues = (res.node as Trackable).issues;
            return [issues.nodes, issues.totalCount];
        } else {
            const res = await client.getFilteredIssueList({
                query: filter,
                count,
                filter: { trackables: { any: { id: { eq: trackableId.value } } } }
            });
            return [res.searchIssues, res.searchIssues.length];
        }
    }
};

const nonPropagatingEdges = ref(new Set<string>());
const createdPropagatingIssues = ref<PropagatedIssue[]>([]);
const propagationConfig = ref(defaultPropagationConfig);
const selectedCharacteristics = ref<string[]>([]);

const componentsWithLookup = computed(() => {
    const graph = originalGraph.value;
    if (graph == undefined) {
        return undefined;
    }
    const components = new Map<string, Component>();
    const componentLookup = new Map<string, string>();
    for (const component of graph.components.nodes) {
        componentLookup.set(component.id, component.component.id);
        for (const inter of component.interfaceDefinitions.nodes) {
            if (inter.visibleInterface != undefined) {
                componentLookup.set(inter.visibleInterface.id, component.component.id);
            }
        }
        if (components.has(component.id)) {
            continue;
        }
        components.set(component.component.id, {
            id: component.component.id,
            name: component.component.name,
            template: component.component.template.id
        });
    }
    return { components, componentLookup };
});

const allCharacteristics = computed(() => {
    const characteristics = extractCharacteristics(propagationConfig.value);
    characteristics.sort();
    return characteristics;
});

const propagatedIssuesAndRelations = computed(() => {
    const graph = originalGraph.value;
    if (graph == undefined) {
        return {
            issues: [],
            propagatingRelations: new Set<string>()
        };
    }
    const { components, componentLookup } = componentsWithLookup.value!;
    const relations = graph.components.nodes.flatMap((component) => {
        return component.outgoingRelations.nodes
            .filter((relation) => !nonPropagatingEdges.value.has(relation.id))
            .map((relation) => {
                return {
                    id: relation.id,
                    from: componentLookup.get(component.id)!,
                    to: componentLookup.get(relation.end!.id)!,
                    template: relation.template.id
                };
            });
    });
    return propagateIssues(
        {
            components: [...components.values()],
            issues: createdPropagatingIssues.value,
            relations
        },
        propagationConfig.value
    );
});

const allPropagatedIssues = computed(() => {
    return propagatedIssuesAndRelations.value.issues;
});

const pending = ref(new Set<string>());
const types = ref(new Map<string, { iconPath: string }>());
const states = ref(new Map<string, { isOpen: boolean }>());

const newPropagationIssueTrackableId = ref("");
const newPropagationIssueValue = ref({
    title: "",
    template: "",
    type: "",
    state: "",
    typePath: "",
    isOpen: false
});
const issueToCreate = ref<PropagatedIssue>();

function createIssue(issue: PropagatedIssue) {
    newPropagationIssueTrackableId.value = propagationComponent.value!.componentId;
    newPropagationIssueValue.value = {
        title: issue.title ?? "",
        template: issue.template,
        type: issue.type,
        state: issue.state,
        typePath: types.value.get(issue.type)?.iconPath ?? "",
        isOpen: states.value.get(issue.state)?.isOpen ?? false
    };
    issueToCreate.value = issue;
    eventBus?.emit("create-issue");
}

function createdPropagationIssue(issue: { state: string; type: string; template: string; title: string; id: string }) {
    const propagatedIssue = issueToCreate.value!;
    propagatedIssue.type = issue.type;
    propagatedIssue.state = issue.state;
    propagatedIssue.template = issue.template;
    propagatedIssue.title = issue.title;
    propagatedIssue.id = issue.id;
    createdPropagatingIssues.value.push(propagatedIssue);
}

watch(
    () => allPropagatedIssues.value,
    (items) => {
        items.forEach((item) => {
            if (!types.value.has(item.type) && !pending.value.has(item.type)) {
                pending.value.add(item.type);
                client.issueType({ id: item.type }).then((type) => {
                    types.value.set(item.type, type.node as { iconPath: string });
                    pending.value.delete(item.type);
                });
            }
            if (!states.value.has(item.state) && !pending.value.has(item.state)) {
                pending.value.add(item.state);
                client.issueState({ id: item.state }).then((state) => {
                    states.value.set(item.state, state.node as { isOpen: boolean });
                    pending.value.delete(item.state);
                });
            }
        });
    },
    {
        deep: true
    }
);

const propagatedIssuesByComponent = computed(() => {
    const issues = new Map<string, PropagatedIssue[]>();
    allPropagatedIssues.value.forEach((issue) => {
        issue.componentsAndInterfaces.forEach((component) => {
            if (issues.has(component)) {
                issues.get(component)!.push(issue);
            } else {
                issues.set(component, [issue]);
            }
        });
    });
    return issues;
});

const propagatingRelations = computed(() => {
    return propagatedIssuesAndRelations.value.propagatingRelations;
});

watch(selectedElement, (element) => {
    const type = element?.contextMenu?.data?.type;
    if (type == "component" || type == "interface") {
        showSidebarForComponent(element!.id);
    } else {
        closePropagationSidebar();
    }
});

function closePropagationSidebar() {
    propagationComponent.value = undefined;
    propagationIssue.value = undefined;
}

function showSidebarForComponent(component: string) {
    propagationComponent.value = graph.value?.components.find((componentVersion) => componentVersion.id === component);
}

function propagateIssue(issue: Issue) {
    propagationIssue.value = issue;
    nonPropagatingEdges.value = new Set<string>();
    createdPropagatingIssues.value = [];
    client.getIssue({ id: issue.id }).then((res) => {
        const issue = res.node as NodeReturnType<"getIssue", "Issue">;
        createdPropagatingIssues.value.push({
            id: issue.id,
            ref: issue.id,
            title: issue.title,
            type: issue.type.id,
            state: issue.state.id,
            template: issue.template.id,
            propagations: [],
            componentsAndInterfaces: [propagationComponent.value!.componentId],
            characteristics: selectedCharacteristics.value
        });
    });
}

function togglePropagationEdge(relation: string) {
    if (nonPropagatingEdges.value.has(relation)) {
        nonPropagatingEdges.value.delete(relation);
    } else {
        nonPropagatingEdges.value.add(relation);
    }
}

function doTestPropagation() {
    const graph = originalGraph.value;
    if (graph == undefined) {
        return {
            issues: [],
            propagatingRelations: new Set<string>()
        };
    }
    const { components, componentLookup } = componentsWithLookup.value!;
    const relations = graph.components.nodes.flatMap((component) => {
        return component.outgoingRelations.nodes.map((relation) => {
            return {
                id: relation.id,
                from: componentLookup.get(component.id)!,
                to: componentLookup.get(relation.end!.id)!,
                template: relation.template.id
            };
        });
    });
    return testPropagation(propagationConfig.value, {
        components: [...components.values()],
        relations
    });
}

const propagatedIssueLookup = computed(() => {
    const lookup = new Map<string | number, PropagatedIssue>();
    allPropagatedIssues.value.forEach((issue) => {
        lookup.set(issue.ref, issue);
    });
    return lookup;
});

const propagationData = computed<PropagationData>(() => {
    return {
        types: types.value,
        states: states.value,
        allCharacteristics: allCharacteristics.value,
        allPropagatedIssues: allPropagatedIssues.value,
        componentsWithLookup: componentsWithLookup.value
    };
});

// endregion

const showAddComponentVersionDialog = ref(false);
const showSelectRelationTemplateDialog = ref(false);
const showAddInterfaceDialog = ref(false);
const initialComponentName = ref("");
const componentVersionComponent = ref("");
const initialComponentVersionVersion = ref("");
const interfaceSpecificationComponent = ref<{ component: string; version: string }>();
const initialInterfaceSpecificationName = ref("");
const interfaceSpecificationVersionInterfaceSpecificaton = ref("");
const initialInterfaceSpecificationVersionVersion = ref("");
const createRelationContext = ref<CreateRelationContext | undefined>(undefined);
const relationTemplateFilter = computed<RelationTemplateFilterInput | undefined>(() => {
    if (createRelationContext.value == undefined) {
        return undefined;
    }
    const context = createRelationContext.value;
    return {
        isDeprecated: { eq: false },
        relationConditions: {
            any: {
                from: {
                    any: {
                        id: {
                            eq: relationPartnerLookup.value.get(context.start)?.template
                        }
                    }
                },
                to: {
                    any: {
                        id: {
                            eq: relationPartnerLookup.value.get(context.end)?.template
                        }
                    }
                }
            }
        }
    };
});

const graph = computed<Graph | null>(() => {
    if (!originalGraph.value) {
        return null;
    }
    const filter = componentTemplateFilter.value;
    const components = originalGraph.value.components.nodes.filter((component) =>
        filter.has(component.component.template.id)
    );
    const componentVersionLookup = new Map<string, string[]>();
    for (const component of components) {
        if (componentVersionLookup.has(component.component.id)) {
            componentVersionLookup.get(component.component.id)!.push(component.id);
        } else {
            componentVersionLookup.set(component.component.id, [component.id]);
        }
    }
    const mappedComponents = components.map<ComponentVersion>((component) => {
        return extractComponent(component, originalGraph.value?.manageComponents ?? false, componentVersionLookup);
    });
    const relationTargetIds = new Set(
        mappedComponents.flatMap((component) => {
            return [component.id, ...component.interfaces.map((inter) => inter.id)];
        })
    );
    const mappedRelations = components.flatMap((component) => {
        const deleteRelation = component.relateFromComponent;
        const res = [...extractRelations(component, deleteRelation, relationTargetIds)];
        for (const definition of component.interfaceDefinitions.nodes) {
            if (definition.visibleInterface != undefined) {
                res.push(...extractRelations(definition.visibleInterface, deleteRelation, relationTargetIds));
            }
        }
        return res;
    });
    let mappedIssueRelations: IssueRelation[] = [];
    if (showIssueRelations.value && !propagationMode.value) {
        components.forEach((component) => {
            mappedIssueRelations.push(...extractIssueRelations(component));
            for (const definition of component.interfaceDefinitions.nodes) {
                if (definition.visibleInterface != undefined) {
                    mappedIssueRelations.push(...extractIssueRelations(definition.visibleInterface));
                }
            }
        });
    }
    return {
        components: mappedComponents,
        relations: mappedRelations,
        issueRelations: mappedIssueRelations,
        propagationMode: propagationIssue.value != undefined
    };
});

const layout = ref<GraphLayout>();

onEvent("layout-component-graph", async () => {
    if (graph.value != undefined) {
        hasLayoutChanges.value = true;
        layout.value = await autolayout(graph.value);
    }
});

async function autolayout(graph: Graph): Promise<GraphLayout> {
    const layoutEngine = new LayoutEngine(graph);
    const coordinates = await layoutEngine.layout();
    const resultingLayout: GraphLayout = {};
    coordinates.forEach((pos, id) => {
        resultingLayout![id] = { pos };
    });
    return resultingLayout;
}

function extractRelations(
    relationPartner: GraphRelationPartnerInfoFragment,
    deleteRelation: boolean,
    validRelationEnds: Set<string>
): Relation[] {
    return relationPartner.outgoingRelations.nodes
        .filter((relation) => validRelationEnds.has(relation.end?.id ?? ""))
        .map((relation) => {
            return {
                id: relation.id,
                name: relation.template.name,
                start: relationPartner.id,
                end: relation.end!.id,
                style: extractRelationStyle(relation.template),
                contextMenu: {
                    type: "relation",
                    delete: deleteRelation
                } satisfies ContextMenuData,
                propagationModeActive:
                    propagationMode.value &&
                    (propagatingRelations.value.has(relation.id) || nonPropagatingEdges.value.has(relation.id))
                        ? !nonPropagatingEdges.value.has(relation.id)
                        : null
            };
        });
}

function extractIssueRelations(relationPartner: GraphRelationPartnerInfoFragment): IssueRelation[] {
    const aggregatedRelations = new Map<string, { start: string; end: string; count: number }>();
    relationPartner.aggregatedIssues.nodes.forEach((aggregatedIssue) => {
        aggregatedIssue.outgoingRelations.nodes.forEach((relation) => {
            const key = `${aggregatedIssue.id}-${relation.end!.id}`;
            if (aggregatedRelations.has(key)) {
                const existing = aggregatedRelations.get(key)!;
                existing.count += aggregatedIssue.count;
            } else {
                aggregatedRelations.set(key, {
                    start: aggregatedIssue.id,
                    end: relation.end!.id,
                    count: aggregatedIssue.count
                });
            }
        });
    });
    return Array.from(aggregatedRelations.values());
}

function extractComponent(
    component: GraphComponentVersionInfoFragment,
    remove: boolean,
    componentVersionLookup: Map<string, string[]>
): ComponentVersion {
    const createRelation = component.relateFromComponent;
    const interfaces: Interface[] = component.interfaceDefinitions.nodes
        .filter((definition) => definition.visibleInterface != undefined)
        .map((definition) => {
            const inter = definition.visibleInterface!;
            return {
                id: inter.id,
                name: definition.interfaceSpecificationVersion.interfaceSpecification.name,
                version: definition.interfaceSpecificationVersion.version,
                style: extractShapeStyle(definition.interfaceSpecificationVersion.interfaceSpecification.template),
                issueTypes: propagationMode.value ? [] : extractIssueTypes(inter),
                contextMenu: {
                    type: "interface",
                    createRelation
                } satisfies ContextMenuData
            };
        });
    let issueTypes: IssueType[];
    const issueRelations: IssueRelation[] = [];
    if (propagationMode.value) {
        const propagatedIssues = propagatedIssuesByComponent.value.get(component.component.id) ?? [];
        const issueTypesMap = new Map<string, IssueType>();
        const existingIssueRelations = new Set<string>();
        propagatedIssues.forEach((issue) => {
            const path = types.value.get(issue.type)?.iconPath;
            const isOpen = states.value.get(issue.state)?.isOpen;
            if (path != undefined && isOpen != undefined) {
                const key = `${issue.type}-${isOpen}-${component.id}`;
                if (issueTypesMap.has(key)) {
                    issueTypesMap.get(key)!.count += 1;
                } else {
                    issueTypesMap.set(key, {
                        id: key,
                        name: issue.type,
                        iconPath: path,
                        count: 1,
                        isOpen
                    });
                }
                for (const propagation of issue.propagations) {
                    const propagationSource = propagatedIssueLookup.value.get(propagation);
                    if (propagationSource != undefined) {
                        const isSourceOpen = states.value.get(propagationSource.state)?.isOpen;
                        if (types.value.has(propagationSource.type) && isSourceOpen != undefined) {
                            for (const sourceComponent of propagationSource.componentsAndInterfaces) {
                                for (const componentVersion of componentVersionLookup.get(sourceComponent) ?? []) {
                                    const sourceKey = `${propagationSource.type}-${isSourceOpen}-${componentVersion}`;
                                    if (!existingIssueRelations.has(sourceKey)) {
                                        issueRelations.push({
                                            start: sourceKey,
                                            end: key,
                                            count: 1
                                        });
                                        existingIssueRelations.add(sourceKey);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        issueTypes = Array.from(issueTypesMap.values());
    } else {
        issueTypes = extractIssueTypes(component);
    }
    return {
        id: component.id,
        name: component.component.name,
        version: component.version,
        style: extractShapeStyle(component.component.template),
        issueTypes,
        interfaces,
        contextMenu: {
            type: "component",
            remove,
            createRelation
        } satisfies ContextMenuData,
        componentId: component.component.id
    };
}

function extractRelationStyle(template: GraphRelationTemplateInfoFragment): RelationStyle {
    let stroke: StrokeStyle["stroke"] = undefined;
    if (template.stroke != undefined) {
        stroke = {
            color: template.stroke.color ?? undefined,
            dash: template.stroke.dash ?? undefined
        };
    }
    return {
        stroke,
        marker: template.markerType
    };
}

function extractShapeStyle(template: GraphRelationPartnerTemplateInfoFragment): ShapeStyle {
    let stroke: StrokeStyle["stroke"] = undefined;
    let fill: FillStyle["fill"] = undefined;
    if (template.fill != undefined) {
        fill = {
            color: template.fill.color ?? undefined
        };
    }
    if (template.stroke != undefined) {
        stroke = {
            color: template.stroke.color ?? undefined,
            dash: template.stroke.dash ?? undefined
        };
    }
    return {
        fill,
        stroke,
        radius: template.shapeRadius ?? undefined,
        shape: template.shapeType
    };
}

function extractIssueTypes(relationPartner: GraphRelationPartnerInfoFragment): IssueType[] {
    return relationPartner.aggregatedIssues.nodes
        .filter((aggregatedIssue) => {
            return (
                (showOpenIssues.value && aggregatedIssue.isOpen) || (showClosedIssues.value && !aggregatedIssue.isOpen)
            );
        })
        .map((aggregatedIssue) => {
            const type = aggregatedIssue.type;
            return {
                id: aggregatedIssue.id,
                name: type.name,
                iconPath: type.iconPath,
                count: aggregatedIssue.count,
                isOpen: aggregatedIssue.isOpen
            };
        })
        .sort((a, b) => {
            if (a.isOpen && !b.isOpen) {
                return -1;
            } else if (!a.isOpen && b.isOpen) {
                return 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });
}

eventBus?.on("add-component-version-to-project", () => {
    showAddComponentVersionDialog.value = true;
});

async function addComponentVersion(componentVersion: IdObject) {
    showAddComponentVersionDialog.value = false;
    await withErrorMessage(async () => {
        const res = await client.addComponentVersionToProject({
            componentVersion: componentVersion.id,
            project: trackableId.value
        });
        const newTemplate = res.addComponentVersionToProject.componentVersion.component.template.id;
        if (!componentTemplateFilter.value.has(newTemplate)) {
            componentTemplateFilter.value.add(newTemplate);
        }
    }, "Error adding component version to project");
    graphVersionCounter.value++;
}

async function createComponent(name: string) {
    showAddComponentVersionDialog.value = false;
    initialComponentName.value = name;
    eventBus?.emit("create-component");
}

async function createComponentVersion(version: string, component: IdObject) {
    showAddComponentVersionDialog.value = false;
    componentVersionComponent.value = component.id;
    initialComponentVersionVersion.value = version;
    eventBus?.emit("create-component-version");
}

function addInterface(componentVersion: string) {
    interfaceSpecificationComponent.value = {
        component: relationPartnerLookup.value.get(componentVersion)!.componentVersion.component.id,
        version: componentVersion
    };
    showAddInterfaceDialog.value = true;
}

async function addInterfaceSpecificationVersion(interfaceSpecificationVersion: IdObject) {
    showAddInterfaceDialog.value = false;
    await withErrorMessage(async () => {
        await client.addInterfaceSpecificationVersionToComponentVersion({
            input: {
                interfaceSpecificationVersion: interfaceSpecificationVersion.id,
                componentVersion: interfaceSpecificationComponent.value!.version,
                visible: true,
                invisible: false
            }
        });
    }, "Error adding interface specification version to component");
    graphVersionCounter.value++;
}

async function createInterfaceSpecification(name: string) {
    showAddInterfaceDialog.value = false;
    initialInterfaceSpecificationName.value = name;
    eventBus?.emit("create-interface-specification");
}

async function createInterfaceSpecificationVersion(version: string, interfaceSpecification: IdObject) {
    showAddInterfaceDialog.value = false;
    interfaceSpecificationVersionInterfaceSpecificaton.value = interfaceSpecification.id;
    initialInterfaceSpecificationVersionVersion.value = version;
    eventBus?.emit("create-interface-specification-version");
}

async function removeComponentVersion(componentVersion: string) {
    await withErrorMessage(async () => {
        await client.removeComponentVersionFromProject({
            componentVersion,
            project: trackableId.value
        });
    }, "Error removing component version from project");
    graphVersionCounter.value++;
}

function beginCreateRelation(context: CreateRelationContext) {
    if (
        relationPartnerLookup.value.get(context.start)?.componentVersion !=
        relationPartnerLookup.value.get(context.end)?.componentVersion
    ) {
        createRelationContext.value = context;
        showSelectRelationTemplateDialog.value = true;
    } else {
        context.cancel();
    }
}

async function createRelation(relationTemplate: IdObject) {
    const context = createRelationContext.value!;
    createRelationContext.value = undefined;
    showSelectRelationTemplateDialog.value = false;
    await withErrorMessage(async () => {
        await client.createRelation({
            start: context.start,
            end: context.end,
            template: relationTemplate.id
        });
    }, "Error creating relation");
    graphVersionCounter.value++;
}

watch(showSelectRelationTemplateDialog, (newValue) => {
    if (!newValue && createRelationContext.value != undefined) {
        createRelationContext.value.cancel();
        createRelationContext.value = undefined;
    }
});

async function deleteRelation(relation: string) {
    await withErrorMessage(async () => {
        await client.deleteRelation({
            id: relation
        });
        if (layout.value != undefined) {
            delete layout.value[relation];
        }
    }, "Error deleting relation");
    graphVersionCounter.value++;
}

interface LayoutUpdate {
    relationLayouts: NonNullable<UpdateViewInput["relationLayouts"]>;
    relationPartnerLayouts: NonNullable<UpdateViewInput["relationPartnerLayouts"]>;
}

function pointsEqual(a: Point[], b: Point[]): boolean {
    if (a.length != b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i].x != b[i].x || a[i].y != b[i].y) {
            return false;
        }
    }
    return true;
}

function roundPoint(point: Point): Point {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}

function computeLayoutDiff(target: GraphLayoutSource): LayoutUpdate {
    const layoutUpdate: LayoutUpdate = {
        relationLayouts: [],
        relationPartnerLayouts: []
    };
    const newLayout = layout.value;
    const currentRelationLayout = new Map(
        target.relationLayouts.nodes.map((relationLayout) => [relationLayout.relation.id, relationLayout.points])
    );
    const currentRelationPartnerLayout = new Map(
        target.relationPartnerLayouts.nodes.map((relationPartnerLayout) => [
            relationPartnerLayout.relationPartner.id,
            relationPartnerLayout.pos
        ])
    );
    for (const [id, layout] of Object.entries(newLayout!)) {
        if (layout == undefined) {
            continue;
        }
        if ("pos" in layout) {
            const pos = layout.pos;
            const current = currentRelationPartnerLayout.get(id);
            if (current == undefined || "points" in current || current.x != pos.x || current.y != pos.y) {
                layoutUpdate.relationPartnerLayouts.push({
                    relationPartner: id,
                    layout: { pos: roundPoint(layout.pos) }
                });
            }
        }
        if ("points" in layout) {
            const points = layout.points;
            const current = currentRelationLayout.get(id);
            if (current == undefined || "pos" in current || !pointsEqual(current, points)) {
                layoutUpdate.relationLayouts.push({
                    relation: id,
                    layout: { points: layout.points.map(roundPoint) }
                });
            }
        }
    }
    for (const id in currentRelationLayout.keys()) {
        if (newLayout![id] == undefined) {
            layoutUpdate.relationLayouts.push({
                relation: id,
                layout: null
            });
        }
    }
    for (const id in currentRelationPartnerLayout.keys()) {
        if (newLayout![id] == undefined) {
            layoutUpdate.relationPartnerLayouts.push({
                relationPartner: id,
                layout: null
            });
        }
    }
    return layoutUpdate;
}

async function updateLayoutOrView() {
    const layoutDiff = computeLayoutDiff(currentView.value ?? originalGraph.value!);
    if (view.value != undefined) {
        await withErrorMessage(async () => {
            let filterByTemplate: string[] | undefined = undefined;
            if (hasFilterChanges.value) {
                if (componentTemplateFilter.value.size != componentTemplates.value.length) {
                    filterByTemplate = [...componentTemplateFilter.value];
                } else {
                    filterByTemplate = [];
                }
            }
            await client.updateView({
                input: {
                    id: view.value!,
                    ...layoutDiff,
                    filterByTemplate
                }
            });
            currentView.value!.filterByTemplate.nodes = componentTemplates.value.filter((template) =>
                componentTemplateFilter.value.has(template.id)
            );
        }, "Error updating view");
    } else {
        await withErrorMessage(async () => {
            await client.updateProject({
                input: {
                    id: trackableId.value,
                    ...layoutDiff
                }
            });
        }, "Error updating project layout");
    }
    hasLayoutChanges.value = false;
}

const cachedNewLayout = ref<Partial<LayoutUpdate>>();

function createView() {
    cachedNewLayout.value = computeLayoutDiff({
        relationLayouts: { nodes: [] },
        relationPartnerLayouts: { nodes: [] }
    });
    eventBus?.emit("create-view");
}

function navigateTo(id: string) {
    const lookupInfo = relationPartnerLookup.value.get(id)!;
    if (lookupInfo.interfaceDefinition != undefined) {
        const interfaceDefinition = lookupInfo.interfaceDefinition;
        router.push({
            name: "interface-specification-version-general",
            params: {
                trackable: lookupInfo.componentVersion.component.id,
                interfaceSpecification: interfaceDefinition.interfaceSpecificationVersion.interfaceSpecification.id,
                interfaceSpecificationVersion: interfaceDefinition.interfaceSpecificationVersion.id
            }
        });
    } else {
        router.push({
            name: "component",
            params: {
                trackable: lookupInfo.componentVersion.component.id
            }
        });
    }
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";

.autocomplete-dialog {
    :deep(.v-overlay__content) {
        top: 175px;
    }

    .v-sheet {
        width: min(1000px, calc(100vw - 3 * settings.$side-bar-width));
        overflow-y: visible !important;
    }
}

.open-issue-chip :deep(.v-icon:not(.mdi-check)) {
    color: rgb(var(--v-theme-issue-open));
}
.closed-issue-chip :deep(.v-icon:not(.mdi-check)) {
    color: rgb(var(--v-theme-issue-closed));
}

.view-autocomplete {
    max-width: 300px;
    :not(:focus-within):deep(input::placeholder) {
        opacity: 1 !important;
    }
}

.bg-surface {
    background: rgb(var(--v-theme-surface));
}
</style>
