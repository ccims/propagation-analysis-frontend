<template>
    <IssueTypeIcon :path="issue.type.iconPath" :fill="iconFill">
        <polygon
            v-if="issue.incomingRelations.totalCount > 0"
            fill="rgb(var(--v-theme-issue-incoming))"
            points="3 11 3 21 10 16"
            transform="scale(3.125)"
        ></polygon>
        <polygon
            v-if="issue.outgoingRelations.totalCount > 0"
            fill="rgb(var(--v-theme-issue-outgoing))"
            points="24 11 24 21 31 16"
            transform="scale(3.125)"
        ></polygon>
    </IssueTypeIcon>
</template>
<script setup lang="ts">
import { DefaultIssueIconInfoFragment } from "@/graphql/generated";
import { computed, watch } from "vue";
import { PropType } from "vue";
import IssueTypeIcon from "./IssueTypeIcon.vue";

const props = defineProps({
    issue: {
        type: Object as PropType<DefaultIssueIconInfoFragment>,
        required: true
    }
});

const iconFill = computed(() => {
    if (props.issue.state.isOpen) {
        return "rgb(var(--v-theme-issue-open))";
    } else {
        return "rgb(var(--v-theme-issue-closed))";
    }
});
</script>
