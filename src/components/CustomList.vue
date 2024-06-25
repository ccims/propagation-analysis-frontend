<template>
    <div v-for="(item, index) in items">
        <v-divider v-if="index != 0" />
        <v-card variant="text" rounded="0" class="px-3" :to="to(item)" @click="$emit('click', item)">
            <slot name="item" :item="item" />
        </v-card>
    </div>
</template>
<script lang="ts" setup generic="T">
import { PropType } from "vue";
import { RouteLocationRaw } from "vue-router";

defineProps({
    to: {
        type: Function as PropType<(item: T) => RouteLocationRaw | undefined>,
        required: true
    },
    items: {
        type: Array as PropType<T[]>,
        required: true
    }
});

defineEmits<{
    (event: "click", item: T): void;
}>()
</script>
