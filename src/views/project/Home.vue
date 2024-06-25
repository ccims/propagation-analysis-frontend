<template>
    <GraphEditor
        v-if="graph != undefined"
        v-model:layout="layout"
        :graph="graph"
        :propagation-mode="propagationMode"
        @remove-component="removeComponentVersion"
        @create-relation="beginCreateRelation"
        @delete-relation="deleteRelation"
        @show-sidebar-for-component="showSidebarForComponent"
        @toggle-propagation-edge="togglePropagationEdge"
    >
        <div class="d-flex flex-column full-height">
            <div class="d-flex">
                <v-spacer />
                <FilterChip v-model="showOpenIssues" label="Open Issues" icon="$issue" class="mr-2 open-issue-chip" />
                <FilterChip
                    v-model="showClosedIssues"
                    label="Closed Issues"
                    icon="$issue"
                    class="mr-2 closed-issue-chip"
                />
                <FilterChip v-model="showIssueRelations" label="Issue Relations" />
                <DefaultButton @click="doTestPropagation">Perform propagation test</DefaultButton>
            </div>
            <v-slide-x-reverse-transition>
                <v-sheet
                    v-if="propagationComponent != undefined"
                    class="sidebar mt-3 pa-2 flex-1-1-0 align-self-stretch d-flex flex-column height-0"
                    color="surface-elevated-3"
                    rounded="xl"
                >
                    <div class="d-flex align-center">
                        <IconButton v-if="propagationMode" @click="propagationIssue = undefined">
                            <v-icon icon="mdi-arrow-left" />
                        </IconButton>
                        <span class="text-subtitle-1 text-ellipses flex-grow-1 ml-3">{{
                            propagationIssue?.title ?? propagationComponent?.name
                        }}</span>
                        <IconButton @click="closePropagationSidebar()">
                            <v-icon icon="mdi-close" />
                        </IconButton>
                    </div>
                    <div class="flex-1-1-0 height-0">
                        <v-window :model-value="propagationWindow" class="full-height">
                            <v-window-item :key="0" class="full-height">
                                <PaginatedList
                                    name="issues"
                                    :item-manager="itemManager"
                                    :sort-fields="Object.keys(sortFields)"
                                    :to="() => undefined"
                                    :sort-ascending-initially="false"
                                    :dependencies="[propagationComponent, propagationIssue]"
                                    @click="propagateIssue"
                                >
                                    <template #item="{ item }">
                                        <IssueListItem :item="item" hide-details />
                                    </template>
                                </PaginatedList>
                            </v-window-item>
                            <v-window-item :key="1" class="full-height issue-list-container">
                                <v-autocomplete
                                    v-model="selectedCharacteristics"
                                    :items="allCharacteristics"
                                    multiple
                                    chips
                                    label="Characteristics"
                                    class="mt-2"
                                />
                                <IssuePropagationList
                                    :items="allPropagatedIssues"
                                    :components="componentsWithLookup?.components ?? new Map()"
                                    :types="types"
                                    :states="states"
                                    @create-issue="createIssue"
                                />
                            </v-window-item>
                        </v-window>
                    </div>
                </v-sheet>
            </v-slide-x-reverse-transition>
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
                hide-no-data
                @selected-item="addComponentVersion"
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
    <CreateIssueDialog :trackable="newPropagationIssueTrackableId" :initial-value="newPropagationIssueValue" @created-issue="createdPropagationIssue" />
</template>
<script lang="ts" setup>
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    GraphRelationPartnerTemplateInfoFragment,
    GraphRelationPartnerInfoFragment,
    GraphComponentVersionInfoFragment,
    GraphRelationTemplateInfoFragment,
    RelationTemplateFilterInput,
    IssueListItemInfoFragment,
    IssueOrderField,
    OrderDirection
} from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import { asyncComputed } from "@vueuse/core";
import GraphEditor, { ContextMenuData, GraphLayoutWrapper } from "@/components/GraphEditor.vue";
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
    CreateRelationContext
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
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import IssueListItem from "@/components/IssueListItem.vue";
import IssuePropagationList from "@/components/IssuePropagationList.vue";
import { Component, PropagatedIssue } from "@/util/propagation/issueModel";
import { propagateIssues } from "@/util/propagation/propagation";
import { defaultPropagationConfig } from "@/util/propagation/defaultPropagationConfig";
import CreateIssueDialog from "@/components/dialog/CreateIssueDialog.vue";
import { testPropagation } from "@/util/propagation/scoreCalculation";

type ProjectGraph = NodeReturnType<"getProjectGraph", "Project">;
type Issue = IssueListItemInfoFragment;
type Trackable = NodeReturnType<"getIssueList", "Component">;

const client = useClient();
const router = useRouter();
const route = useRoute();
const eventBus = inject(eventBusKey);

const trackableId = computed(() => route.params.trackable as string);
const graphVersionCounter = ref(0);

const evaluating = ref(false);
const originalGraph = asyncComputed(
    async () => {
        graphVersionCounter.value;
        if (!trackableId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getProjectGraph({ project: trackableId.value }),
            "Error loading project graph"
        );
        return res.node as ProjectGraph;
    },
    null,
    { shallow: false, evaluating }
);

const relationPartnerTemplateLookup = computed<Map<string, string>>(() => {
    const res = new Map<string, string>();
    if (originalGraph.value != undefined) {
        originalGraph.value.components.nodes.forEach((component) => {
            res.set(component.id, component.component.template.id);
            component.interfaceDefinitions.nodes.forEach((definition) => {
                if (definition.visibleInterface != undefined) {
                    res.set(
                        definition.visibleInterface.id,
                        definition.interfaceSpecificationVersion.interfaceSpecification.template.id
                    );
                }
            });
        });
    }
    return res;
});

const showOpenIssues = ref(true);
const showClosedIssues = ref(false);
const showIssueRelations = ref(true);

// region propagation stuff

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

const itemManager: ItemManager<Issue, keyof typeof sortFields> = {
    fetchItems: async function (
        filter: string | undefined,
        sortField: keyof typeof sortFields,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[Issue[], number]> {
        if (filter == undefined) {
            const res = await client.getIssueList({
                orderBy: {
                    field: sortFields[sortField],
                    direction: sortAscending ? OrderDirection.Asc : OrderDirection.Desc
                },
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
                trackable: trackableId.value
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
    const characteristics = new Set<string>();
    const config = propagationConfig.value;
    Object.values(config.schemas).forEach((schema) => {
        schema.characteristics.forEach((characteristic) => {
            characteristics.add(characteristic);
        });
    });
    config.rules.forEach((rule) => {
        (rule.filterIssue.characteristics ?? []).forEach((characteristic) => {
            characteristics.add(characteristic);
        });
    });
    const sortedCharacteristics = Array.from(characteristics);
    sortedCharacteristics.sort();
    return sortedCharacteristics;
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
})
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

function createdPropagationIssue(issue: { state: string, type: string, template: string, title: string, id: string }) {
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
        issue.components.forEach((component) => {
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
            components: [propagationComponent.value!.componentId],
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
        return component.outgoingRelations.nodes
            .map((relation) => {
                return {
                    id: relation.id,
                    from: componentLookup.get(component.id)!,
                    to: componentLookup.get(relation.end!.id)!,
                    template: relation.template.id
                };
            });
    });
    return testPropagation(
        propagationConfig.value,
        {
            components: [...components.values()],
            relations
        },
    );
}

// endregion

const showAddComponentVersionDialog = ref(false);
const showSelectRelationTemplateDialog = ref(false);
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
                            eq: relationPartnerTemplateLookup.value.get(context.start)
                        }
                    }
                },
                to: {
                    any: {
                        id: {
                            eq: relationPartnerTemplateLookup.value.get(context.end)
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
    const components = originalGraph.value.components.nodes;
    let mappedIssueRelations: IssueRelation[] = [];
    const componentVersionLookup = new Map<string, string[]>();
    for (const component of components) {
        if (componentVersionLookup.has(component.component.id)) {
            componentVersionLookup.get(component.component.id)!.push(component.id);
        } else {
            componentVersionLookup.set(component.component.id, [component.id]);
        }
    }
    const mappedComponents = components.map<ComponentVersion>((component) => {
        const [mappedComponent, issueRelations] = extractComponent(
            component,
            originalGraph.value?.manageComponents ?? false,
            componentVersionLookup
        );
        mappedIssueRelations.push(...issueRelations);
        return mappedComponent;
    });
    const mappedRelations = components.flatMap((component) => {
        const deleteRelation = component.relateFromComponent;
        const res = [...extractRelations(component, deleteRelation)];
        for (const definition of component.interfaceDefinitions.nodes) {
            if (definition.visibleInterface != undefined) {
                res.push(...extractRelations(definition.visibleInterface, deleteRelation));
            }
        }
        return res;
    });
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
    if (propagationMode.value) {
    }
    return {
        components: mappedComponents,
        relations: mappedRelations,
        issueRelations: mappedIssueRelations,
        propagationMode: propagationIssue.value != undefined
    };
});

const layout = ref<GraphLayoutWrapper>({
    layout: {},
    resetViewport: true
});

watch(evaluating, async (newValue, oldValue) => {
    if (!newValue && oldValue) {
        layout.value = {
            layout: await autolayout(graph.value!),
            resetViewport: true
        };
    }
});

onEvent("layout-component-graph", async () => {
    if (graph.value != undefined) {
        layout.value = {
            layout: await autolayout(graph.value),
            resetViewport: true
        };
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

function extractRelations(relationPartner: GraphRelationPartnerInfoFragment, deleteRelation: boolean): Relation[] {
    return relationPartner.outgoingRelations.nodes.map((relation) => {
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

const propagatedIssueLookup = computed(() => {
    const lookup = new Map<string | number, PropagatedIssue>();
    allPropagatedIssues.value.forEach((issue) => {
        lookup.set(issue.ref, issue);
    });
    return lookup;
});

function extractComponent(
    component: GraphComponentVersionInfoFragment,
    remove: boolean,
    componentVersionLookup: Map<string, string[]>
): [ComponentVersion, IssueRelation[]] {
    const createRelation = component.relateFromComponent;
    const interfaces: Interface[] = component.interfaceDefinitions.nodes
        .filter((definition) => definition.visibleInterface != undefined)
        .map((definition) => {
            const inter = definition.visibleInterface!;
            return {
                id: inter.id,
                name: definition.interfaceSpecificationVersion.name,
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
                            for (const sourceComponent of propagationSource.components) {
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
    return [
        {
            id: component.id,
            componentId: component.component.id,
            name: component.name,
            version: component.version,
            style: extractShapeStyle(component.component.template),
            issueTypes,
            interfaces,
            contextMenu: {
                type: "component",
                remove,
                createRelation
            } satisfies ContextMenuData
        },
        issueRelations
    ];
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
        await client.addComponentVersionToProject({
            componentVersion: componentVersion.id,
            project: trackableId.value
        });
    }, "Error adding component version to project");
    graphVersionCounter.value++;
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
    createRelationContext.value = context;
    showSelectRelationTemplateDialog.value = true;
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
    }, "Error deleting relation");
    graphVersionCounter.value++;
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";

.autocomplete-dialog {
    :deep(.v-overlay__content) {
        top: 120px;
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

.height-0 {
    height: 0;
}

.sidebar {
    width: 500px;
}

.issue-list-container {
    overflow-y: auto;
}
</style>
