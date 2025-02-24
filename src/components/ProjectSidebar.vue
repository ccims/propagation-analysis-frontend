<template>
    <v-slide-x-reverse-transition>
        <v-sheet
            v-if="model != undefined"
            class="sidebar mt-3 py-2 flex-1-1-0 align-self-stretch d-flex flex-column h-0 pointer-events-all"
            color="surface-elevated-3"
            rounded="xl"
        >
            <div class="d-flex align-center mx-2">
                <IconButton v-if="propagationMode" @click="propagationIssue = undefined">
                    <v-icon icon="mdi-arrow-left" />
                </IconButton>
                <span class="text-subtitle-1 text-ellipses flex-grow-1 ml-2">{{
                    model.componentVersion.component.name
                }}</span>
                <IconButton
                    :to="{
                        name: 'component-issues',
                        params: { trackable: model!.componentVersion.component.id }
                    }"
                >
                    <v-icon icon="mdi-arrow-right-circle-outline" />
                    <v-tooltip activator="parent">View all issues</v-tooltip>
                </IconButton>
                <IconButton v-if="propagationWindow == 0" @click="whatIfMode = true">
                    <v-icon icon="mdi-help-circle-outline" />
                    <v-tooltip activator="parent">What if analysis</v-tooltip>
                </IconButton>
                <IconButton @click="model = undefined">
                    <v-icon icon="mdi-close" />
                </IconButton>
            </div>
            <div class="flex-1-1-0 h-0">
                <v-window :model-value="propagationWindow" class="h-100">
                    <v-window-item :key="0" class="h-100">
                        <PaginatedList
                            name="issues"
                            :item-manager="itemManager"
                            :sort-fields="sortFields"
                            :to="() => undefined"
                            :sort-ascending-initially="false"
                            :dependencies="[model.componentVersion.id, issueFilter, propagationIssue]"
                            @click="(event: Issue) => (propagationIssue = event)"
                        >
                            <template #item="{ item }">
                                <IssueListItem :item="item" hide-details />
                            </template>
                            <template #additional-filter>
                                <div class="ga-2 d-flex flex-wrap mb-2">
                                    <v-chip
                                        v-if="issueFilter.affectedEntity != undefined"
                                        rounded="lg"
                                        variant="outlined"
                                        closable
                                        close-icon="mdi-close"
                                        :prepend-icon="
                                            model.affectedEntity.__typename == 'ComponentVersion'
                                                ? '$component-version'
                                                : '$interface'
                                        "
                                        @click:close="issueFilter.affectedEntity = undefined"
                                    >
                                        {{ model.affectedEntityName }}
                                    </v-chip>
                                    <v-chip
                                        v-if="issueFilter.type != undefined"
                                        rounded="lg"
                                        variant="outlined"
                                        closable
                                        close-icon="mdi-close"
                                        @click:close="issueFilter.type = undefined"
                                    >
                                        {{ issueFilter.type.name }}
                                        <template #prepend>
                                            <IssueTypeIcon
                                                :path="issueFilter.type.iconPath"
                                                fill="currentColor"
                                                height="18px"
                                                class="v-icon--start"
                                            />
                                        </template>
                                    </v-chip>
                                    <v-chip
                                        v-if="issueFilter.isOpen != undefined"
                                        rounded="lg"
                                        variant="outlined"
                                        closable
                                        close-icon="mdi-close"
                                        :class="{
                                            'open-issue-chip': issueFilter.isOpen,
                                            'closed-issue-chip': !issueFilter.isOpen
                                        }"
                                        prepend-icon="mdi-circle"
                                        @click:close="issueFilter.isOpen = undefined"
                                    >
                                        {{ issueFilter.isOpen ? "Open" : "Closed" }}
                                    </v-chip>
                                </div>
                            </template>
                        </PaginatedList>
                    </v-window-item>
                    <v-window-item :key="1" class="full-height issue-list-container">
                        <IssueTemplateAutocomplete
                            v-if="whatIfMode"
                            v-model="template"
                            class="mt-2 px-3"
                        />
                        <IssueTypeAutocomplete
                            v-if="whatIfMode"
                            v-model="type"
                            :template="template"
                            :disabled="!template"
                            class="mt-2 px-3"
                        />
                        <IssueStateAutocomplete
                            v-if="whatIfMode"
                            v-model="state"
                            :template="template"
                            :disabled="!template"
                            class="mt-2 px-3"
                        />
                        <v-autocomplete
                            v-model="selectedCharacteristics"
                            :items="propagationData.allCharacteristics"
                            multiple
                            chips
                            label="Characteristics"
                            class="mt-2 px-3"
                        />
                        <IssuePropagationList
                            :items="propagationData.allPropagatedIssues"
                            :components="propagationData.components ?? new Map()"
                            :types="propagationData.types"
                            :states="propagationData.states"
                            @create-issue="$emit('create-issue', $event)"
                        />
                    </v-window-item>
                </v-window>
            </div>
        </v-sheet>
    </v-slide-x-reverse-transition>
</template>
<script setup lang="ts">
import { PropType, computed, ref, watch } from "vue";
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import {
    GraphAggregatedIssueInfoFragment,
    GraphComponentVersionInfoFragment,
    GraphRelationPartnerInfoFragment,
    IssueFilterInput,
    IssueListItemInfoFragment,
    IssueOrder,
    IssueOrderField
} from "@/graphql/generated";
import { NodeReturnType, useClient } from "@/graphql/client";
import IssueListItem from "@/components/IssueListItem.vue";
import IssueTypeIcon from "@/components/IssueTypeIcon.vue";
import { IdObject } from "@/util/types";
import { RouteLocationRaw } from "vue-router";
import { Component, PropagatedIssue } from "@/util/propagation/issueModel";
import IssuePropagationList from "./IssuePropagationList.vue";
import IssueTemplateAutocomplete from "./input/IssueTemplateAutocomplete.vue";
import IssueTypeAutocomplete from "./input/IssueTypeAutocomplete.vue";
import IssueStateAutocomplete from "./input/IssueStateAutocomplete.vue";

type Issue = IssueListItemInfoFragment;
type Trackable = NodeReturnType<"getIssueList", "Component">;
type AggregatedIssue = NodeReturnType<"getIssueListOnAggregatedIssue", "AggregatedIssue">;

defineProps({
    propagationData: {
        type: Object as PropType<PropagationData>,
        required: true
    }
});

const model = defineModel({
    type: Object as PropType<SelectableElementInfo>,
    required: false
});

const selectedCharacteristics = defineModel("selectedCharacteristics", {
    type: Array as PropType<string[]>,
    required: true
});

const template = defineModel("template", {
    type: String,
    required: false
});
const type = defineModel("type", {
    type: String,
    required: false
});
const state = defineModel("state", {
    type: String,
    required: false
});

const whatIfMode = defineModel("whatIfMode", {
    type: Boolean,
    required: false
});

const propagationIssue = defineModel("propagationIssue", {
    type: Object as PropType<Issue>,
    required: false
});

defineEmits<{
    (event: "create-issue", value: PropagatedIssue): void;
}>();

const client = useClient();

interface IssueFilterSpec {
    isOpen?: boolean;
    type?: { id: string; name: string; iconPath: string };
    aggregatedIssue?: string;
    affectedEntity?: GraphRelationPartnerInfoFragment;
}

const issueFilter = ref<IssueFilterSpec>({});

export interface SelectableElementInfo {
    componentVersion: GraphComponentVersionInfoFragment;
    affectedEntity: GraphRelationPartnerInfoFragment;
    affectedEntityName: string;
    aggregatedIssue?: GraphAggregatedIssueInfoFragment;
}

watch(model, (newValue) => {
    if (newValue != undefined) {
        const aggregatedIssue = newValue.aggregatedIssue;
        if (aggregatedIssue != undefined) {
            issueFilter.value = {
                aggregatedIssue: aggregatedIssue.id,
                isOpen: aggregatedIssue.isOpen,
                affectedEntity: newValue.affectedEntity,
                type: aggregatedIssue.type
            };
        } else {
            issueFilter.value = {
                affectedEntity: newValue.affectedEntity
            };
        }
    }
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
        const additionalFilter = issueFilter.value;
        const useAggregatedIssue =
            additionalFilter.aggregatedIssue != undefined &&
            additionalFilter.affectedEntity != undefined &&
            additionalFilter.isOpen != undefined;
        if (filter == undefined) {
            const parameters = {
                orderBy,
                count,
                skip: page * count
            };
            if (!useAggregatedIssue) {
                const filterFields: IssueFilterInput = {};
                if (additionalFilter.isOpen != undefined) {
                    filterFields.state = { isOpen: { eq: additionalFilter.isOpen } };
                }
                if (additionalFilter.type != undefined) {
                    filterFields.type = { id: { eq: additionalFilter.type.id } };
                }
                if (additionalFilter.affectedEntity != undefined) {
                    filterFields.aggregatedBy = {
                        any: { relationPartner: { id: { eq: additionalFilter.affectedEntity.id } } }
                    };
                }
                const res = await client.getIssueList({
                    ...parameters,
                    trackable: model.value!.componentVersion.component.id,
                    filter: filterFields
                });
                const issues = (res.node as Trackable).issues;
                return [issues.nodes, issues.totalCount];
            } else {
                const res = await client.getIssueListOnAggregatedIssue({
                    ...parameters,
                    aggregatedIssue: additionalFilter.aggregatedIssue!
                });
                const issues = (res.node as AggregatedIssue).issues;
                return [issues.nodes, issues.totalCount];
            }
        } else {
            const filterFields: IssueFilterInput = {};
            if (!useAggregatedIssue) {
                if (additionalFilter.isOpen != undefined) {
                    filterFields.state = { isOpen: { eq: additionalFilter.isOpen } };
                }
                if (additionalFilter.type != undefined) {
                    filterFields.type = { id: { eq: additionalFilter.type.id } };
                }
                if (additionalFilter.affectedEntity != undefined) {
                    filterFields.aggregatedBy = {
                        any: { relationPartner: { id: { eq: additionalFilter.affectedEntity.id } } }
                    };
                }
                filterFields.trackables = {
                    any: { id: { eq: model.value!.componentVersion.component.id } }
                };
            } else {
                filterFields.aggregatedBy = { any: { id: { eq: additionalFilter.aggregatedIssue } } };
            }
            const res = await client.getFilteredIssueList({
                query: filter,
                count,
                filter: filterFields
            });
            return [res.searchIssues, res.searchIssues.length];
        }
    }
};

function issueRoute(issue: IdObject): RouteLocationRaw {
    return {
        name: "component-issue",
        params: { issue: issue.id, trackable: model.value!.componentVersion.component.id }
    };
}

export interface PropagationData {
    types: Map<string, { iconPath: string }>;
    states: Map<string, { isOpen: boolean }>;
    allCharacteristics: string[];
    allPropagatedIssues: PropagatedIssue[];
    components: Map<string, Component>;
}

const propagationMode = computed(() => {
    return propagationIssue.value != undefined;
});

const propagationWindow = computed(() => {
    return propagationMode.value ? 1 : 0;
});
</script>
<style scoped>
.sidebar {
    width: 500px;
}

.open-issue-chip :deep(.v-icon:not(.mdi-close)) {
    color: rgb(var(--v-theme-issue-open));
}
.closed-issue-chip :deep(.v-icon:not(.mdi-close)) {
    color: rgb(var(--v-theme-issue-closed));
}
</style>
