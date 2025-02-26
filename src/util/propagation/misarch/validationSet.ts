import { ValidationIssue } from "../scoreCalculation";
import { BUG, Characteristics, FEATURE, OPEN } from "./templates";

export enum ComponentEnum {
    Frontend = "6a2d05a8-f4d3-4292-87f6-20ff7a903ef5",
    Gateway = "95aeb50d-1b49-435a-825e-68726185af4d",
    Shipment = "7e950759-a1a6-472e-871b-c401bd2e6962",
    Payment = "c8086263-6c45-47cb-9146-58a07f4d4670",
    Discount = "78360200-032b-48e4-bebe-7db29a47e0cb",
    Return = "db0055e5-aa0a-481b-a4d4-9372b06b6a1f",
    Invoice = "a34faad0-c72a-450d-9ebe-d9a4016508ab",
    Order = "c4de9d8c-316a-43b1-b06f-bbdb9a5826f7",
    Wishlist = "de05c302-04f0-4f74-8972-db6aec995475",
    Notification = "ebc55f2e-2931-420a-a03a-3d5aa0573ff6",
    Review = "a7df3315-63ae-4fde-b639-17a4b092b0df",
    Tax = "85e62fdc-1538-48bc-8867-d092dfb2e025",
    Inventory = "9019fd44-a88f-40e5-8b75-b5ec91ba2213",
    ShoppingCart = "9ead9837-ad31-4d3c-bb97-d4ed07b208ba",
    Media = "b8cb6b11-851a-4299-b9e0-ad39ea442771",
    Catalog = "ea305f60-8360-4fb9-8742-0185746333e3",
    User = "f308cca2-4184-4613-868d-5dc6741f96a7",
    Address = "32208ea3-8eac-47c2-984e-3fc09065fd3c",
    Keycloak = "b690eb36-f823-49ae-8277-01438554cf78",
    RUSTGraphQLLibrary = "abc8f8c2-9560-4de7-adb4-93405df88f6d",
    KotlinGraphQLLibrary = "4cb5436e-b54d-4dd8-bcd5-4526523a98ff",
    NodeJsGraphQLLibrary = "e750e48c-ab88-43ab-942c-c7fcecd0ff13",
    keycloakJS = "51a88003-e295-490a-9ba3-d1825beffba7",
    mongoNestJSLibrary = "3eb9b14e-8ee0-4e9e-8644-fbb58e629981",
    Infrastructure = "6744370d-dde0-4004-a8b0-f03277824831"
}

enum InterfaceEnum {
    Order_OrderOrderCreated = "da29cfa1-8302-4354-a5b8-777e38cbe872",
    Discount_DiscountOrderValidationSucceeded = "bda209d9-7cc1-4482-910e-6a1acbb49e3c",
    Inventory_OrderOrderCreated = "37ce2c5a-44d7-440a-8082-8a51b3ec5e33",
    Inventory_PaymentPaymentPaymentFailed = "0196ae18-c1b8-4e90-b0c3-0e4c541971da",
    Inventory_PaymentPaymentPaymentEnabled = "18eaf3f8-7471-4cd0-a42f-392561077228",
    Inventory_DiscountOrderValidationFailed = "33e7ffb3-48e0-48a2-9869-c7ba46b5361c",
    Catalog_GraphQLProvidedGateway = "68f21d89-d82d-4f74-aea7-0c61a7d3725d"
}

export const misarchValidationSet: ValidationIssue<ComponentEnum | InterfaceEnum>[] = [
    {
        description: "Bug in GraphQL library for Rust introduces breaking changes",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ApiBreakingBug],
        initialComponent: ComponentEnum.RUSTGraphQLLibrary,
        propagation: [
            // direct
            ComponentEnum.Order,
            ComponentEnum.Invoice,
            ComponentEnum.Review,
            ComponentEnum.Wishlist,
            ComponentEnum.ShoppingCart,
            ComponentEnum.Media,
            // transitive
            ComponentEnum.Gateway,
            ComponentEnum.Frontend
        ]
    },
    {
        description: "Bug in GraphQL library for Rust introduces breaking changes by invalidating data",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ApiBreakingByzantineBug],
        initialComponent: ComponentEnum.RUSTGraphQLLibrary,
        propagation: [
            // direct
            ComponentEnum.Order,
            ComponentEnum.Invoice,
            ComponentEnum.Review,
            ComponentEnum.Wishlist,
            ComponentEnum.ShoppingCart,
            ComponentEnum.Media,
            // transitive
            ComponentEnum.Gateway,
            ComponentEnum.Frontend,
            // transitive (byzantine)
            ComponentEnum.Discount,
            ComponentEnum.Shipment,
            ComponentEnum.Inventory,
            ComponentEnum.Payment,
            ComponentEnum.Return,
            ComponentEnum.Catalog // invalid data from media service
        ]
    },
    {
        description: "Bug in GraphQL library for Kotlin introduces breaking changes",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ApiBreakingBug],
        initialComponent: ComponentEnum.KotlinGraphQLLibrary,
        propagation: [
            // direct
            ComponentEnum.Return,
            ComponentEnum.Discount,
            ComponentEnum.Notification,
            ComponentEnum.Tax,
            ComponentEnum.User,
            ComponentEnum.Catalog,
            ComponentEnum.Address,
            ComponentEnum.Shipment,
            // transitive
            ComponentEnum.Gateway,
            ComponentEnum.Frontend,
            ComponentEnum.Order
        ]
    },
    {
        description: "Bug in GraphQL library for Kotlin introduces breaking changes by invalidating data",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ApiBreakingByzantineBug],
        initialComponent: ComponentEnum.KotlinGraphQLLibrary,
        propagation: [
            // direct
            ComponentEnum.Return,
            ComponentEnum.Discount,
            ComponentEnum.Notification,
            ComponentEnum.Tax,
            ComponentEnum.User,
            ComponentEnum.Catalog,
            ComponentEnum.Address,
            ComponentEnum.Shipment,
            // transitive
            ComponentEnum.Gateway,
            ComponentEnum.Frontend,
            ComponentEnum.Order,
            // transitive (byzantine)
            ComponentEnum.Inventory,
            ComponentEnum.Payment,
            ComponentEnum.Invoice,
            ComponentEnum.Wishlist,
            ComponentEnum.ShoppingCart,
            ComponentEnum.Review
        ]
    },
    {
        description: "New version with breaking changes. Update required",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.LibraryVersionUpdate],
        initialComponent: ComponentEnum.keycloakJS,
        propagation: [ComponentEnum.Frontend]
    },
    {
        description: "New version with breaking changes. Update required",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.LibraryVersionUpdate],
        initialComponent: ComponentEnum.KotlinGraphQLLibrary,
        propagation: [
            ComponentEnum.Return,
            ComponentEnum.Discount,
            ComponentEnum.Notification,
            ComponentEnum.Tax,
            ComponentEnum.User,
            ComponentEnum.Catalog,
            ComponentEnum.Address,
            ComponentEnum.Shipment
        ]
    },
    {
        description: "Security related problem with GraphQL Rust GraphQL library.",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.LibraryVersionUpdate],
        initialComponent: ComponentEnum.RUSTGraphQLLibrary,
        propagation: [
            ComponentEnum.Order,
            ComponentEnum.Invoice,
            ComponentEnum.Review,
            ComponentEnum.Wishlist,
            ComponentEnum.ShoppingCart,
            ComponentEnum.Media
        ]
    },
    {
        description: "Typo in OrderDTO field. Rename orderIteems to orderItems.",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.DtoBug],
        initialComponent: InterfaceEnum.Order_OrderOrderCreated,
        propagation: [
            // direct
            ComponentEnum.Inventory,
            ComponentEnum.Return,
            ComponentEnum.ShoppingCart,
            // transitive via saga
            ComponentEnum.Discount,
            ComponentEnum.Invoice,
            ComponentEnum.Shipment,
            ComponentEnum.Payment
        ] // all after frontend may not be covered by rule. Update rule to both direction?
    },
    {
        description:
            "Notifications should be sent for Wishlist items that obtain a specific Discount in order to inform the user.",
        type: "Feature",
        state: "Open",
        initialCharacteristics: [Characteristics.FeatureRequestUpToDown],
        initialComponent: ComponentEnum.Wishlist,
        propagation: [ComponentEnum.Discount]
    },
    {
        description:
            "Product Variant Versions should get a popularity field, that describes a weighted sum of how much the Product Variant Version is sold recently.",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.FeatureRequestUpToDown],
        initialComponent: ComponentEnum.Inventory,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description:
            "The discount service does not send out its event for successful discount validation /discount/order/validation-succeeded",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.MissingEventCall],
        initialComponent: InterfaceEnum.Discount_DiscountOrderValidationSucceeded,
        propagation: [
            // direct
            ComponentEnum.Invoice,
            ComponentEnum.Payment,
            // transitive via saga
            ComponentEnum.Shipment,
            ComponentEnum.Return // not informed that item was delivered
        ]
    },
    {
        description: "Domain model of bounded context Discount inaccurate, has to be modified",
        type: FEATURE, // TODO maybe change back
        state: OPEN,
        initialCharacteristics: [Characteristics.FeatureRequestUpToDown],
        initialComponent: ComponentEnum.Discount,
        propagation: [
            // downstream
            ComponentEnum.Gateway,
            ComponentEnum.Frontend,
            ComponentEnum.Invoice,
            ComponentEnum.Payment,
            ComponentEnum.Order
        ]
    },
    {
        description: "Pods regularly crash in current K8 setup.",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.InfrastructureFailure],
        initialComponent: ComponentEnum.Infrastructure,
        propagation: [
            ComponentEnum.Frontend,
            ComponentEnum.Gateway,
            ComponentEnum.Shipment,
            ComponentEnum.Payment,
            ComponentEnum.Discount,
            ComponentEnum.Return,
            ComponentEnum.Invoice,
            ComponentEnum.Order,
            ComponentEnum.Wishlist,
            ComponentEnum.Notification,
            ComponentEnum.Review,
            ComponentEnum.Tax,
            ComponentEnum.Inventory,
            ComponentEnum.ShoppingCart,
            ComponentEnum.Catalog,
            ComponentEnum.User,
            ComponentEnum.Address,
            ComponentEnum.Media,
            ComponentEnum.Keycloak
        ]
    },
    {
        description:
            "Add items to shopping cart without logging in. The Frontend should cache the shopping cart of a user that has yet to log in in the user session (of the browser) and send the shopping cart information as a batch to the Shopping Cart service once the user has logged in.",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.FeatureRequestDownToUp],
        initialComponent: ComponentEnum.Frontend,
        propagation: [ComponentEnum.Gateway, ComponentEnum.ShoppingCart]
    },
    {
        description: "Catalog service crashes.",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ServiceUnavailable],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description:
            "Introduction of subcategories / hierarchies between categories. Originally, the domain model did not allow categories to relate to one another. Categories would coexist independently. Now, the model must be modified because categories should be able to have subcategories.",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.FeatureRequestUpToDown],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend, ComponentEnum.Discount]
    },
    {
        description: "DTO validation fails for date.",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.APIUsageBug],
        initialComponent: [
            InterfaceEnum.Inventory_DiscountOrderValidationFailed,
            InterfaceEnum.Inventory_OrderOrderCreated,
            InterfaceEnum.Inventory_PaymentPaymentPaymentEnabled,
            InterfaceEnum.Inventory_PaymentPaymentPaymentFailed
        ],
        propagation: [
            // via saga
            ComponentEnum.Discount,
            ComponentEnum.Shipment,
            ComponentEnum.Payment,
            ComponentEnum.Invoice,
            ComponentEnum.Return
        ]
    },
    {
        description: "Auth error in endpoint",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ApiBreakingBug],
        initialComponent: ComponentEnum.Order,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: "Service crashes due to amount of logs",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ServiceUnavailable],
        initialComponent: ComponentEnum.Order,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description: "Service has long start up time, leadung to unavailability in the first seconds",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.ServiceUnavailable],
        initialComponent: ComponentEnum.Catalog,
        propagation: [ComponentEnum.Gateway, ComponentEnum.Frontend]
    },
    {
        description:
            "Missing Dependancy Tags break services. I.e. mongo:latest is used in package.json and mongo introduces breaking changes regarding transactions or replications that render all Nest.JS services useless.",
        type: BUG,
        state: OPEN,
        initialCharacteristics: [Characteristics.LibraryBreakingChange],
        initialComponent: ComponentEnum.mongoNestJSLibrary,
        propagation: [
            // direct
            ComponentEnum.Inventory,
            ComponentEnum.Payment,
            // transitive via GraphQL
            ComponentEnum.Order,
            ComponentEnum.Gateway,
            ComponentEnum.Frontend,
            // transitive via saga
            ComponentEnum.Invoice,
            ComponentEnum.Discount,
            ComponentEnum.Shipment,
            ComponentEnum.Return
        ]
    },
    {
        description: "Add stripe as payment provider",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.FeatureRequestDownToUp, Characteristics.FeatureRequestUpToDown],
        initialComponent: ComponentEnum.Payment,
        propagation: [
            ComponentEnum.Gateway,
            ComponentEnum.Frontend,
            // backwards & forwards via saga (all need to adapt DTOs + validation)
            ComponentEnum.Discount,
            ComponentEnum.Shipment,
            ComponentEnum.Order,
            ComponentEnum.Inventory
        ]
    },
    {
        description: "Add new field to product GraphQL DTO",
        type: FEATURE,
        state: OPEN,
        initialCharacteristics: [Characteristics.DtoFeature],
        initialComponent: InterfaceEnum.Catalog_GraphQLProvidedGateway,
        propagation: [ComponentEnum.Frontend, ComponentEnum.Gateway]
    }
];
