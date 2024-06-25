<template>
    <v-sheet v-for="(item, idx) in items" :key="item.ref" rounded="xl" class="pa-2" :class="{ 'mt-2' : idx > 0 }">
        <div class="d-flex align-center">
            <IssueIcon
                v-if="types.has(item.type) && states.has(item.state)"
                height="40px"
                class="mr-2 flex-0-0"
                :issue="{
                    outgoingRelations: { totalCount: 0 },
                    incomingRelations: { totalCount: 0 },
                    state: states.get(item.state)!,
                    type: types.get(item.type)!
                }"
            ></IssueIcon>
            <span class="text-ellipses flex 1-1-0">{{ item.title ?? "No title" }}</span>
        </div>
        <div class="ga-2 d-flex align-center mt-1">
            <v-chip v-for="characteristic in item.characteristics" size="small" color="tertiary" >{{ characteristic }}</v-chip>
        </div>
        <div class="mt-1 d-flex flex-wrap ga-2 align-center">
            <v-chip
                v-for="component in item.components"
                :key="component"
                color="primary"
            >
                {{ components.get(component)?.name ?? "Error" }}
            </v-chip>
            <v-chip
                v-for="component in item.additionalComponents"
                v-if="item.id != undefined"
                variant="outlined"
                prepend-icon="mdi-plus"
                :key="component"
                color="primary"
            >
                {{ components.get(component)?.name ?? "Error" }}
            </v-chip>
            <v-spacer/>
            <DefaultButton v-if="item.id == undefined" @click="$emit('create-issue', item)">
                Create issue
            </DefaultButton>
        </div>
    </v-sheet>
</template>
<script setup lang="ts">
import { Component, PropagatedIssue } from "@/util/propagation/issueModel";
import { PropType, watch } from "vue";
import IssueIcon from "./IssueIcon.vue";
import { ref } from "vue";
import { useClient } from "@/graphql/client";

const props = defineProps({
    items: {
        type: Array as PropType<PropagatedIssue[]>,
        required: true
    },
    components: {
        type: Object as PropType<Map<string, Component>>,
        required: true
    },
    types: {
        type: Object as PropType<Map<string, { iconPath: string }>>,
        required: true
    },
    states: {
        type: Object as PropType<Map<string, { isOpen: boolean }>>,
        required: true
    }
});

defineEmits<{
    (event: "create-issue", value: PropagatedIssue): void;
}>();
</script>
<style scoped></style>
