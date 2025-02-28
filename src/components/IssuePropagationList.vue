<template>
    <v-sheet v-for="(item, idx) in items" :key="item.ref" rounded="xl" class="pa-2 mx-3" :class="{ 'mt-2': idx > 0 }">
        <div class="d-flex align-center">
            <IssueIcon
                v-if="types.get(item.type) && states.get(item.state)"
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
            <v-chip v-for="characteristic in item.characteristics" size="small" color="tertiary">{{
                characteristic
            }}</v-chip>
        </div>
        <div class="mt-1 d-flex flex-wrap ga-2 align-center">
            <v-chip v-for="component in item.componentsAndInterfaces" :key="component" color="primary">
                {{ names.get(component) ?? "Error" }}
            </v-chip>
            <v-spacer />
            <DefaultButton v-if="item.id == undefined && !whatIfMode" @click="$emit('create-issue', item)">
                Create issue
            </DefaultButton>
        </div>
    </v-sheet>
</template>
<script setup lang="ts">
import { Component, PropagatedIssue } from "@/util/propagation/issueModel";
import { PropType } from "vue";
import IssueIcon from "./IssueIcon.vue";

const props = defineProps({
    items: {
        type: Array as PropType<PropagatedIssue[]>,
        required: true
    },
    names: {
        type: Object as PropType<Map<string, string>>,
        required: true
    },
    types: {
        type: Object as PropType<Map<string, { iconPath: string }>>,
        required: true
    },
    states: {
        type: Object as PropType<Map<string, { isOpen: boolean }>>,
        required: true
    },
    whatIfMode: {
        type: Boolean,
        required: true
    }
});

defineEmits<{
    (event: "create-issue", value: PropagatedIssue): void;
}>();
</script>
<style scoped></style>
