package com.dommia.resident.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ResidentNotice(
    val id: String = "",
    val title: String = "",
    val content: String = "",
    val category: String? = null,
    val priority: String? = null,
    @SerialName("author_name") val authorName: String? = null,
    @SerialName("is_pinned") val isPinned: Boolean = false,
    @SerialName("published_at") val publishedAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
)
