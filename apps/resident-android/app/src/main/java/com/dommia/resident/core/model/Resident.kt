package com.dommia.resident.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ResidentProfile(
    val id: String = "",
    @SerialName("first_name") val firstName: String = "",
    @SerialName("last_name") val lastName: String = "",
    val email: String = "",
    val phone: String? = null,
    @SerialName("property_id") val propertyId: String? = null,
    val role: String = "RESIDENT",
    @SerialName("is_primary") val isPrimary: Boolean = false,
    val isActive: Boolean = true,
    @SerialName("must_change_password") val mustChangePassword: Boolean = false,
    val street: String? = null,
    @SerialName("exterior_number") val exteriorNumber: String? = null,
    @SerialName("interior_number") val interiorNumber: String? = null,
    val block: String? = null,
    val lot: String? = null,
)

@Serializable
data class ResidentProfileResponse(
    val resident: ResidentProfile,
    val tenantSlug: String,
)
