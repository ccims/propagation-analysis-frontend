<template>
    <v-dialog v-model="createIssueDialog" persistent width="auto">
        <TemplatedNodeDialogContent
            item-name="issue"
            confirmation-message="Create issue"
            :form-meta="meta"
            :form-validate="validate"
            color="surface-elevated-3"
            :submit-disabled="submitDisabled"
            @cancel="cancelCreateIssue"
            @confirm="createIssue"
        >
            <template #general>
                <div class="d-flex">
                    <v-card
                        v-if="icon"
                        variant="outlined"
                        rounded="default"
                        height="48px"
                        width="48px"
                        class="mr-2 icon-container"
                    >
                        <IssueIcon :issue="icon" class="issue-icon" />
                    </v-card>
                    <v-text-field v-model="title" v-bind="titleProps" label="Title" class="mb-1" />
                </div>
                <div class="d-flex flex-wrap mx-n2">
                    <IssueTemplateAutocomplete
                        v-model="template"
                        v-bind="templateProps"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <IssueTypeAutocomplete
                        v-model="type"
                        v-bind="typeProps"
                        :template="template"
                        :disabled="!template"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                        @selected-item="onSelectedType"
                    />
                    <IssueStateAutocomplete
                        v-model="state"
                        v-bind="stateProps"
                        :template="template"
                        :disabled="!template"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                        @selected-item="onSelectedState"
                    />
                </div>
                <SimpleField
                    v-model="body"
                    v-bind="bodyProps"
                    variant="outlined"
                    label="Body"
                    color="primary"
                    class="markdown-field"
                >
                    <Markdown v-model="body" v-bind="bodyProps" edit-mode editable class="full-width ma-2" />
                </SimpleField>
            </template>
            <template #templatedFields>
                <TemplatedFieldsInputVue
                    v-if="templateValue != undefined"
                    :schema="templateValue.templateFieldSpecifications"
                    :model-value="templatedFields"
                />
            </template>
        </TemplatedNodeDialogContent>
    </v-dialog>
</template>
<script setup lang="ts">
import SimpleField from "@/components/input/SimpleField.vue";
import IssueTemplateAutocomplete from "@/components/input/IssueTemplateAutocomplete.vue";
import Markdown from "@/components/Markdown.vue";
import { PropType, ref, watch } from "vue";
import { onEvent } from "@/util/eventBus";
import IssueTypeAutocomplete from "../input/IssueTypeAutocomplete.vue";
import IssueStateAutocomplete from "../input/IssueStateAutocomplete.vue";
import * as yup from "yup";
import { useForm } from "vee-validate";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import { NodeReturnType, useClient } from "@/graphql/client";
import { toTypedSchema } from "@vee-validate/yup";
import IssueIcon from "../IssueIcon.vue";
import { DefaultIssueIconInfoFragment } from "@/graphql/generated";
import { computed } from "vue";
import TemplatedNodeDialogContent from "./TemplatedNodeDialogContent.vue";
import TemplatedFieldsInputVue, { Field } from "../input/schema/TemplatedFieldsInput.vue";
import { asyncComputed } from "@vueuse/core";
import { generateDefaultData } from "../input/schema/generateDefaultData";
import { IdObject } from "@/util/types";
import { nextTick } from "vue";

const createIssueDialog = ref(false);
const client = useClient();
const typePath = ref<string | undefined>(undefined);
const isOpen = ref<boolean | undefined>(undefined);
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

interface AdditionalIssueData {
    title: string;
    template: string;
    type: string;
    state: string;
}

const emit = defineEmits<{
    (event: "created-issue", issue: IdObject & AdditionalIssueData): void;
}>();

const props = defineProps({
    trackable: {
        type: String,
        required: true
    },
    initialValue: {
        type: Object as PropType<AdditionalIssueData & { typePath: string, isOpen: boolean }>,
        required: false
    }
});

watch(
    () => props.initialValue,
    (value) => {
        resetForm({
            values: value
        });
        typePath.value = value?.typePath;
        isOpen.value = value?.isOpen;
        nextTick(() => {
            resetForm({
                values: value
            });
        });
    },
    {
        deep: true
    }
);

const schema = toTypedSchema(
    yup.object().shape({
        title: yup.string().required().label("Title"),
        template: yup.string().required().label("Template"),
        type: yup.string().required().label("Type"),
        state: yup.string().required().label("State"),
        body: yup.string().label("Body")
    })
);

const { defineField, resetForm, handleSubmit, meta, validate, setValues } = useForm({
    validationSchema: schema
});

const [title, titleProps] = defineField("title", fieldConfig);
const [template, templateProps] = defineField("template", fieldConfig);
const [type, typeProps] = defineField("type", fieldConfig);
const [state, stateProps] = defineField("state", fieldConfig);
const [body, bodyProps] = defineField("body", fieldConfig);

const icon = computed<DefaultIssueIconInfoFragment | undefined>(() => {
    if (typePath.value != undefined && isOpen.value != undefined) {
        return {
            type: {
                iconPath: typePath.value
            },
            state: {
                isOpen: isOpen.value
            },
            incomingRelations: {
                totalCount: 0
            },
            outgoingRelations: {
                totalCount: 0
            }
        };
    }
    return undefined;
});

const templatedFields = ref<Field[]>([]);
const templateValue = asyncComputed(
    async () => {
        if (template.value == null) {
            return null;
        }
        const templateRes = await withErrorMessage(async () => {
            return client.getIssueTemplate({ id: template.value! });
        }, "Error loading template");
        const templateNode = templateRes.node as NodeReturnType<"getIssueTemplate", "IssueTemplate">;
        return templateNode;
    },
    null,
    { shallow: false }
);
watch(templateValue, (newValue, oldValue) => {
    if (newValue != null && newValue.id != oldValue?.id) {
        templatedFields.value = newValue.templateFieldSpecifications.map((spec) => ({
            name: spec.name,
            value: generateDefaultData(spec.value, spec.value)
        }));
    }
});

onEvent("create-issue", () => {
    resetForm();
    createIssueDialog.value = true;
});

watch(
    () => template.value,
    () => {
        setValues({ type: undefined, state: undefined }, false);
    }
);

const createIssue = handleSubmit(async (submitState) => {
    const issue = await blockWithErrorMessage(async () => {
        const res = await client.createIssue({
            input: {
                ...submitState,
                body: submitState.body ?? "",
                templatedFields: templatedFields.value,
                trackables: [props.trackable]
            }
        });
        return res.createIssue.issue;
    }, "Error creating issue");
    createIssueDialog.value = false;
    emit("created-issue", {
        id: issue.id,
        title: title.value ?? "",
        template: template.value!,
        type: type.value!,
        state: state.value!,
    });
});

function cancelCreateIssue() {
    createIssueDialog.value = false;
}

function onSelectedType(type: { iconPath: string }) {
    typePath.value = type.iconPath;
}

function onSelectedState(state: { isOpen: boolean }) {
    isOpen.value = state.isOpen;
}
</script>
<style scoped lang="scss">
.wrap-input {
    min-width: 200px;
}

.issue-icon {
    height: 48px;
    width: 48px;
}

.icon-container {
    color: rgba(var(--v-theme-on-surface), 0.38);
}

:deep(.markdown-field .v-field-label) {
    top: 65px;
}
</style>
