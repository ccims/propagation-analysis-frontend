import { ValidationIssue } from "../scoreCalculation";

export enum ComponentEnum {
    "frontend" = "8cc60e49-5e8f-48f5-a6f8-da3fef65a554",
    "adService" = "df444679-4d65-44ee-a65f-29714ed7bad2",
    "checkoutService" = "22e8168f-65bb-44b0-9224-d0fd6cb96d6f",
    "paymentService" = "6b12bbc9-696f-44d5-b7d5-9e47fc1879c2",
    "productCatalogService" = "45bb229b-abea-4e2e-a179-c54f931a95b6",
    "recommendationService" = "b0a62ff9-fd76-4605-8964-44969657692a",
    "currencyService" = "1955b58f-6995-4649-a023-ecd2f2acd66a"
}
export const onlineBoutiqueValidationSet: ValidationIssue<ComponentEnum>[] = [
    {
        description: "Ad service is unreachable",
        type: "Bug",
        state: "Open",
        initialCharacteristics: ["service unreachable"],
        initialComponent: ComponentEnum.adService,
        propagation: [ComponentEnum.frontend]
    },
    {
        description: "Ad service returns error response due to internal error",
        type: "Bug",
        state: "Open",
        initialCharacteristics: ["error response"],
        initialComponent: ComponentEnum.adService,
        propagation: [ComponentEnum.frontend]
    },
    {
        description: "Latency of ad service is too high",
        type: "Bug",
        state: "Open",
        initialCharacteristics: ["high latency", "request timeout"],
        initialComponent: ComponentEnum.adService,
        propagation: [ComponentEnum.frontend]
    },
    {
        description: "Payment service is unreachable",
        type: "Bug",
        state: "Open",
        initialCharacteristics: ["service unreachable"],
        initialComponent: ComponentEnum.paymentService,
        propagation: [ComponentEnum.checkoutService, ComponentEnum.frontend]
    },
    {
        description: "Product catalog service is unreachable",
        type: "Bug",
        state: "Open",
        initialCharacteristics: ["service unreachable"],
        initialComponent: ComponentEnum.productCatalogService,
        propagation: [ComponentEnum.recommendationService, ComponentEnum.frontend]
    },
    {
        description: "Currency service is unreachable",
        type: "Bug",
        state: "Open",
        initialCharacteristics: ["service unreachable"],
        initialComponent: ComponentEnum.currencyService,
        propagation: [ComponentEnum.checkoutService, ComponentEnum.frontend]
    }
];
