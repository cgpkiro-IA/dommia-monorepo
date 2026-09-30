package com.dommia.resident.core.model

import kotlinx.serialization.Serializable

@Serializable
data class VisitorPass(
    val id: String = "",
    val visitorName: String = "",
    val validFrom: String = "",
    val validUntil: String = "",
    val passType: String = "TEMPORARY",
    val accessCount: Int = 0,
    val notes: String? = null,
    val status: String = "ACTIVE",
    val usedAt: String? = null,
    val createdAt: String = "",
)

@Serializable
data class CreateVisitorPassRequest(
    val visitorName: String,
    val passType: String,
    val validDays: Int,
    val notes: String? = null,
)
