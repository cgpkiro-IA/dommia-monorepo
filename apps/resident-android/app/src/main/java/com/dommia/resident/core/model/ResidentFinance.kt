package com.dommia.resident.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class FinancialCharge(
    val id: String = "",
    val concept: String = "",
    val amount: Double = 0.0,
    @SerialName("balance_due") val balanceDue: Double = 0.0,
    @SerialName("due_date") val dueDate: String? = null,
    val status: String = "PENDING",
)

@Serializable
data class RecentPayment(
    val id: String = "",
    val amount: Double = 0.0,
    val reference: String? = null,
    val status: String = "PENDING",
    @SerialName("paid_at") val paidAt: String? = null,
)

@Serializable
data class FinancialStatus(
    val propertyId: String = "",
    val totalBalanceDue: Double = 0.0,
    val totalCharged: Double = 0.0,
    val totalPaid: Double = 0.0,
    val creditBalance: Double = 0.0,
    val accountStatus: String = "UP_TO_DATE",
    val hasPendingCharges: Boolean = false,
    val pendingChargesCount: Int = 0,
    val charges: List<FinancialCharge> = emptyList(),
    val recentPayments: List<RecentPayment> = emptyList(),
)

@Serializable
data class AnnualCampaign(
    val id: String = "",
    val name: String = "",
    @SerialName("discount_percentage") val discountPercentage: Double = 0.0,
    @SerialName("months_covered") val monthsCovered: Int = 12,
    @SerialName("period_start") val periodStart: String? = null,
    @SerialName("period_end") val periodEnd: String? = null,
    val status: String = "ACTIVE",
)

@Serializable
data class AnnualCampaignQuote(
    val campaign: AnnualCampaign? = null,
    val grossAmount: Double = 0.0,
    val discountAmount: Double = 0.0,
    val netAmount: Double = 0.0,
    val existingCommitment: ExistingCommitment? = null,
)

@Serializable
data class ExistingCommitment(
    val id: String = "",
    val status: String = "PENDING_APPROVAL",
)
