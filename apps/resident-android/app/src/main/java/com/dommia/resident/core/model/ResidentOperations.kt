package com.dommia.resident.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ActiveService(
    val id: String = "",
    @SerialName("service_type") val serviceType: String = "OTHER",
    @SerialName("custom_service_name") val customServiceName: String? = null,
    @SerialName("supplier_name") val supplierName: String? = null,
    @SerialName("vehicle_plates") val vehiclePlates: String? = null,
    @SerialName("destination_type") val destinationType: String = "SPECIFIC",
    val status: String = "IN_TRANSIT",
    val notes: String? = null,
    @SerialName("entered_at") val enteredAt: String? = null,
)

@Serializable
data class ActiveDelivery(
    val id: String = "",
    @SerialName("recipient_name") val recipientName: String = "",
    @SerialName("property_address") val propertyAddress: String = "",
    val carrier: String? = null,
    @SerialName("tracking_code") val trackingCode: String? = null,
    val notes: String? = null,
    val status: String = "PENDING",
    @SerialName("received_at") val receivedAt: String? = null,
)

data class ResidentOperations(
    val services: List<ActiveService> = emptyList(),
    val deliveries: List<ActiveDelivery> = emptyList(),
)
