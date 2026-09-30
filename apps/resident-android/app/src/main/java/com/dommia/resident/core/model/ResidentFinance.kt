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

@Serializable
data class MonthlyFinancialReport(
    val id: String = "",
    @SerialName("period_start") val periodStart: String = "",
    val revision: Int = 1,
    @SerialName("published_at") val publishedAt: String? = null,
    @SerialName("reviewed_by_current_resident") val reviewedByCurrentResident: Boolean = false,
    @SerialName("report_snapshot") val snapshot: MonthlyReportSnapshot = MonthlyReportSnapshot(),
)

@Serializable
data class MonthlyReportSnapshot(
    val opening: MonthlyReportOpening = MonthlyReportOpening(),
    val income: MonthlyReportTotal = MonthlyReportTotal(),
    val expenses: MonthlyReportExpenses = MonthlyReportExpenses(),
    val reportEvidence: List<MonthlyReportEvidence> = emptyList(),
    val activity: MonthlyReportActivity = MonthlyReportActivity(),
    val closing: MonthlyReportClosing = MonthlyReportClosing(),
)

@Serializable
data class MonthlyReportOpening(val bank: Double = 0.0, val cash: Double = 0.0, val total: Double = 0.0)

@Serializable
data class MonthlyReportTotal(
    val total: Double = 0.0,
    val regular: List<MonthlyReportIncomeLine> = emptyList(),
    val annualAdvance: MonthlyReportAnnualAdvance = MonthlyReportAnnualAdvance(),
)

@Serializable
data class MonthlyReportIncomeLine(
    val category: String = "",
    val paymentMethod: String = "",
    val count: Int = 0,
    val amount: Double = 0.0,
)

@Serializable
data class MonthlyReportAnnualAdvance(val count: Int = 0, val amount: Double = 0.0)

@Serializable
data class MonthlyReportExpenses(
    val total: Double = 0.0,
    val byCategory: List<MonthlyReportCategory> = emptyList(),
    val items: List<MonthlyReportExpenseItem> = emptyList(),
)

@Serializable
data class MonthlyReportExpenseItem(
    val id: String = "",
    val category: String = "",
    val description: String = "",
    val vendorName: String? = null,
    val expenseDate: String = "",
    val amount: Double = 0.0,
    val evidence: List<MonthlyReportEvidence> = emptyList(),
)

@Serializable
data class MonthlyReportEvidence(
    val id: String = "",
    val fileName: String = "evidencia",
    val contentType: String = "application/octet-stream",
    val sizeBytes: Int = 0,
)

@Serializable
data class MonthlyReportActivity(
    val pendingPaymentCount: Int = 0,
    val pendingPaymentAmount: Double = 0.0,
    val chargesIssuedCount: Int = 0,
    val chargesIssuedAmount: Double = 0.0,
    val chargesOutstandingAmount: Double = 0.0,
)

@Serializable
data class MonthlyReportCategory(
    val category: String = "",
    val count: Int = 0,
    val amount: Double = 0.0,
)

@Serializable
data class MonthlyReportClosing(
    val calculated: Double = 0.0,
    val reportedTotal: Double = 0.0,
    val variance: Double = 0.0,
)
