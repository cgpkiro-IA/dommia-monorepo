package com.dommia.resident.core.model

import kotlinx.serialization.Serializable

@Serializable
data class AccessCredential(
    val code: String = "",
    val payload: String = "",
    val stepExpiresAt: Long = 0L,
    val timeRemaining: Long = 0L,
)
