<template>
    <ListItem :title="item.title" :subtitle="item.title">
        <template #prepend>
            <IssueIcon :issue="item" height="40px" class="mr-2 flex-0-0" />
        </template>
        <template #append v-if="!hideDetails">
            <div class="mr-7 user-stack-container">
                <UserStack
                    :users="item.assignments.nodes.map((assignment) => assignment.user)"
                    size="small"
                    class="pa-3"
                />
            </div>
            <div class="text-medium-emphasis icon-container d-flex align-center">
                <v-icon color="issue-incoming" class="triangle-right mr-1" size="x-small" icon="mdi-triangle" />
                {{ item.incomingRelations.totalCount }}
            </div>
            <div class="text-medium-emphasis icon-container d-flex align-center">
                {{ item.outgoingRelations.totalCount }}
                <v-icon color="issue-outgoing" class="triangle-right ml-1" size="x-small" icon="mdi-triangle" />
            </div>
            <div class="text-medium-emphasis icon-container">
                <v-icon icon="mdi-comment-outline" />
                {{ item.issueComments.totalCount }}
            </div>
        </template>
        <template #subtitle>
            <div class="text-medium-emphasis text-body-2">
                was created <RelativeTimeWrapper :time="item.createdAt" /> by
                <User :user="item.createdBy" size="small" />
            </div>
        </template>
        <template #title-append v-if="!hideDetails">
            <Label
                v-for="(label, idx) in item.labels.nodes"
                :key="idx"
                :label="label"
                class="ml-2 flex-shrink-0"
                size="small"
            />
        </template>
        <template #title-prepend v-if="trackablesInfo != undefined">
            <v-chip color="primary" size="small" class="mr-2 flex-shrink-0" :prepend-icon="trackablesInfo.icon">
                {{ trackablesInfo.trackable.name }}
                <template v-if="trackablesInfo.totalCount > 1"> +{{ trackablesInfo.totalCount - 1 }}</template>
                <v-tooltip v-if="trackablesInfo.trackable.description" activator="parent" location="bottom">
                    {{ trackablesInfo.trackable.description }}
                </v-tooltip>
            </v-chip>
        </template>
    </ListItem>
</template>
<script lang="ts" setup>
import { IssueListItemInfoFragment, ParticipatingIssueListItemInfoFragment } from "@/graphql/generated";
import { PropType, computed } from "vue";
import UserStack from "./UserStack.vue";
import IssueIcon from "./IssueIcon.vue";
import ListItem from "./ListItem.vue";
import RelativeTimeWrapper from "./RelativeTimeWrapper.vue";
import Label from "./info/Label.vue";
import User from "./info/User.vue";

const props = defineProps({
    item: {
        type: Object as PropType<IssueListItemInfoFragment | ParticipatingIssueListItemInfoFragment>,
        required: true
    },
    hideDetails: {
        type: Boolean,
        default: false
    }
});

const trackablesInfo = computed(() => {
    const item = props.item;
    if ("trackables" in item) {
        const trackable = item.trackables.nodes[0];
        return {
            trackable,
            totalCount: item.trackables.totalCount,
            icon: trackable.__typename == "Component" ? "$component" : "$project"
        };
    } else {
        return undefined;
    }
});
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.icon-container {
    min-width: settings.$icon-with-number-width;
}
.triangle-right {
    rotate: 90deg;
}
.user-stack-container {
    background: transparent;
}
</style>
